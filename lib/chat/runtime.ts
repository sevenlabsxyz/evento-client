'use client';

import {
  fetchMessagingUserById,
  fetchMessagingUserByPubkey,
  syncMessagingIdentity,
} from '@/lib/chat/api';
import {
  CHAT_INVITE_LOOKBACK_SECONDS,
  CHAT_KEY_PACKAGE_CLIENT,
  DEFAULT_CHAT_RELAYS,
} from '@/lib/chat/constants';
import { GroupSubscriptionManager } from '@/lib/chat/group-subscription-manager';
import { chatDatabaseBroker } from '@/lib/chat/storage/database-broker';
import { ChatMetadataStore } from '@/lib/chat/storage/metadata-store';
import type {
  ChatConversation,
  ChatConversationRecord,
  ChatMessage,
  ChatParticipant,
  ChatRuntimeSnapshot,
} from '@/lib/chat/types';
import type { UserDetails } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import {
  GroupRumorHistory,
  InviteReader,
  KEY_PACKAGE_KIND,
  MarmotClient,
  type NostrNetworkInterface,
  type PublishResponse,
} from '@internet-privacy/marmot-ts';
import type { SerializedAccount } from 'applesauce-accounts';
import { PrivateKeyAccount } from 'applesauce-accounts/accounts';
import type { Rumor } from 'applesauce-common/helpers/gift-wrap';
import { type NostrEvent } from 'applesauce-core/helpers';
import { mapEventsToTimeline } from 'applesauce-core/observable';
import { onlyEvents, RelayPool } from 'applesauce-relay';
import { lastValueFrom, Subscription } from 'rxjs';

const emptySnapshot = (): ChatRuntimeSnapshot => ({
  status: 'idle',
  conversations: [],
  messagesByConversation: {},
  currentUserParticipant: null,
  error: null,
});

interface DirectConversationTarget {
  userId: string;
  username?: string;
  name?: string;
  image?: string | null;
  verification_status?: UserDetails['verification_status'];
  nostr_pubkey?: string;
  nip05?: string;
}

export class EventoChatRuntime {
  private readonly authUser: UserDetails;
  private readonly metadataStore: ChatMetadataStore;
  private readonly listeners = new Set<() => void>();
  private readonly conversationsById = new Map<string, ChatConversationRecord>();
  private readonly conversationAliases = new Map<string, string>();
  private readonly messagesByConversation = new Map<string, ChatMessage[]>();
  private readonly participantLookupPromises = new Map<string, Promise<ChatParticipant>>();

  private snapshot: ChatRuntimeSnapshot = emptySnapshot();
  private account: PrivateKeyAccount | null = null;
  private client: MarmotClient<GroupRumorHistory> | null = null;
  private inviteReader: InviteReader | null = null;
  private pool: RelayPool | null = null;
  private groupSubscriptionManager: GroupSubscriptionManager | null = null;
  private runtimeSubscription = new Subscription();
  private groupWatchAbortController: AbortController | null = null;
  private historyAbortControllers = new Map<string, AbortController>();

  constructor(authUser: UserDetails) {
    this.authUser = authUser;
    this.metadataStore = new ChatMetadataStore(authUser.id);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): ChatRuntimeSnapshot {
    return this.snapshot;
  }

  async start(): Promise<void> {
    try {
      const storedAccount = await this.metadataStore.getAccount();
      const onboardingComplete = await this.metadataStore.getOnboardingComplete();

      if (!storedAccount || !onboardingComplete) {
        this.setSnapshot({
          ...emptySnapshot(),
          status: 'needs-onboarding',
        });
        return;
      }

      this.account = PrivateKeyAccount.fromJSON(storedAccount as SerializedAccount);
      await this.initializeClient();
    } catch (error) {
      logger.error('Failed to start chat runtime', error);
      this.setSnapshot({
        ...emptySnapshot(),
        status: 'error',
        error: 'Failed to start secure chat',
      });
    }
  }

  async completeOnboarding(): Promise<void> {
    try {
      const account = PrivateKeyAccount.generateNew();
      await this.metadataStore.setAccount(account.toJSON());
      await this.metadataStore.setOnboardingComplete(true);
      this.account = account;
      await this.initializeClient();
    } catch (error) {
      logger.error('Failed to initialize new chat identity', error);
      this.setSnapshot({
        ...this.snapshot,
        status: 'error',
        error: 'We could not finish setting up secure chat.',
      });
      throw error;
    }
  }

  async openDirectConversation(target: DirectConversationTarget): Promise<string> {
    if (!this.client || !this.account) {
      throw new Error('Chat is not ready yet');
    }

    const participant = await this.resolveDirectParticipant(target);
    const existingConversationId = await this.findConversationIdForParticipant(participant);

    if (existingConversationId) {
      return existingConversationId;
    }

    const keyPackageEvent = await this.fetchLatestKeyPackageEvent(participant.pubkey);

    if (!keyPackageEvent) {
      throw new Error(`${participant.username} has not set up chat yet`);
    }

    const group = await this.client.createGroup(participant.username, {
      description: `Direct messages with ${participant.username}`,
      relays: [...DEFAULT_CHAT_RELAYS],
    });

    await group.inviteByKeyPackageEvent(keyPackageEvent);
    const conversationId = await this.persistConversationRecord(group.idStr, participant);
    await this.attachGroupHistory(group);
    this.recomputeConversations();

    return conversationId;
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    if (!this.client) {
      throw new Error('Chat is not ready');
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    const group = await this.client.getGroup(this.resolveConversationId(conversationId));
    await group.sendChatMessage(trimmed);
  }

  markConversationSeen(conversationId: string): void {
    const resolvedConversationId = this.resolveConversationId(conversationId);
    const messages = this.messagesByConversation.get(resolvedConversationId);
    const latest = messages?.[messages.length - 1];
    if (!latest || !this.groupSubscriptionManager) {
      return;
    }

    const seenAtSeconds = Math.floor(new Date(latest.createdAt).getTime() / 1000);
    this.groupSubscriptionManager.markConversationSeen(resolvedConversationId, seenAtSeconds);
    this.recomputeConversations();
  }

  destroy(): void {
    this.runtimeSubscription.unsubscribe();
    this.runtimeSubscription = new Subscription();
    this.groupWatchAbortController?.abort();
    this.groupWatchAbortController = null;

    for (const controller of this.historyAbortControllers.values()) {
      controller.abort();
    }

    this.historyAbortControllers.clear();
    this.groupSubscriptionManager?.stop();
    this.groupSubscriptionManager = null;
    this.pool = null;
    this.client = null;
    this.inviteReader = null;
    this.account = null;
    this.conversationsById.clear();
    this.conversationAliases.clear();
    this.messagesByConversation.clear();
    this.participantLookupPromises.clear();
    this.setSnapshot(emptySnapshot());
  }

  private async initializeClient(): Promise<void> {
    if (!this.account) {
      throw new Error('No local account found');
    }

    this.setSnapshot({
      ...this.snapshot,
      status: 'initializing',
      currentUserParticipant: this.createCurrentUserParticipant(this.account.pubkey),
      error: null,
    });

    const storage = await chatDatabaseBroker.getStorageInterfaces(this.account.pubkey);
    const pool = new RelayPool();
    const network: NostrNetworkInterface = {
      publish: async (relays, event) => {
        const results = await pool.publish(relays, event);
        return results.reduce<Record<string, PublishResponse>>((accumulator, result) => {
          accumulator[result.from] = result;
          return accumulator;
        }, {});
      },
      request: async (relays, filters) =>
        lastValueFrom(pool.request(relays, filters).pipe(mapEventsToTimeline())),
      subscription: (relays, filters) => pool.subscription(relays, filters).pipe(onlyEvents()),
      getUserInboxRelays: async () => [...DEFAULT_CHAT_RELAYS],
    };

    const client = new MarmotClient<GroupRumorHistory>({
      signer: this.account.signer,
      groupStateBackend: storage.groupStateBackend,
      keyPackageStore: storage.keyPackageStore,
      network,
      historyFactory: storage.historyFactory,
    });

    const inviteReader = new InviteReader({
      signer: this.account.signer,
      store: storage.inviteStore,
    });

    this.pool = pool;
    this.client = client;
    this.inviteReader = inviteReader;
    this.groupSubscriptionManager = new GroupSubscriptionManager(client, pool);

    await this.metadataStore.saveParticipant(
      this.createCurrentUserParticipant(this.account.pubkey)
    );
    void syncMessagingIdentity(this.createCurrentUserParticipant(this.account.pubkey)).catch(
      (error) => {
        logger.warn('Failed to sync messaging identity', error);
      }
    );

    await client.loadAllGroups();
    await this.ensureKeyPackage();
    await this.restoreConversationRecords();
    this.startWatchingGroups();
    this.startInviteSubscription();
    void this.startUnreadSubscription();
    void this.groupSubscriptionManager.start();

    this.setSnapshot({
      ...this.snapshot,
      status: 'ready',
      currentUserParticipant: this.createCurrentUserParticipant(this.account.pubkey),
      error: null,
    });
  }

  private async ensureKeyPackage(): Promise<void> {
    if (!this.client) {
      return;
    }

    const existingPackages = await this.client.keyPackages.list();
    if (existingPackages.length > 0) {
      return;
    }

    await this.client.keyPackages.create({
      relays: [...DEFAULT_CHAT_RELAYS],
      client: CHAT_KEY_PACKAGE_CLIENT,
    });
  }

  private async restoreConversationRecords(): Promise<void> {
    const records = await this.metadataStore.listConversations();
    this.conversationsById.clear();
    this.conversationAliases.clear();

    const sortedRecords = records
      .slice()
      .sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );

    for (const record of sortedRecords) {
      const existingConversationId = await this.findConversationIdForParticipant(
        record.participant
      );
      if (existingConversationId && existingConversationId !== record.id) {
        this.conversationAliases.set(record.id, existingConversationId);
        continue;
      }

      this.conversationsById.set(record.id, record);
    }

    this.recomputeConversations();
  }

  private startWatchingGroups(): void {
    if (!this.client || !this.account) {
      return;
    }

    this.groupWatchAbortController?.abort();
    this.groupWatchAbortController = new AbortController();
    const { signal } = this.groupWatchAbortController;

    void (async () => {
      for await (const groups of this.client!.watchGroups()) {
        if (signal.aborted) {
          break;
        }

        const activeIds = new Set(groups.map((group) => group.idStr));
        for (const [groupId, controller] of this.historyAbortControllers.entries()) {
          if (!activeIds.has(groupId)) {
            controller.abort();
            this.historyAbortControllers.delete(groupId);
          }
        }

        for (const group of groups) {
          await this.ensureConversationMetadataForGroup(group);
          await this.attachGroupHistory(group);
        }
      }
    })().catch((error) => {
      if (!signal.aborted) {
        logger.error('Failed to watch Marmot groups', error);
      }
    });
  }

  private startInviteSubscription(): void {
    if (!this.pool || !this.account || !this.inviteReader) {
      return;
    }

    const subscription = this.pool
      .subscription([...DEFAULT_CHAT_RELAYS], {
        kinds: [1059],
        '#p': [this.account.pubkey],
        since: Math.floor(Date.now() / 1000) - CHAT_INVITE_LOOKBACK_SECONDS,
      })
      .pipe(onlyEvents())
      .subscribe({
        next: (event) => {
          void this.handleInviteEvent(event);
        },
      });

    this.runtimeSubscription.add(subscription);
  }

  private async handleInviteEvent(event: NostrEvent): Promise<void> {
    if (!this.inviteReader || !this.client) {
      return;
    }

    const ingested = await this.inviteReader.ingestEvent(event);
    if (!ingested) {
      return;
    }

    const invite = await this.inviteReader.decryptGiftWrap(event.id);
    if (!invite) {
      return;
    }

    const { group } = await this.client.joinGroupFromWelcome({
      welcomeRumor: invite,
    });
    await this.inviteReader.markAsRead(invite.id);
    await this.ensureConversationMetadataForGroup(group, invite.pubkey);
    await this.attachGroupHistory(group);
    this.recomputeConversations();
  }

  private async startUnreadSubscription(): Promise<void> {
    if (!this.groupSubscriptionManager) {
      return;
    }

    const subscription = this.groupSubscriptionManager.unreadConversationIds.subscribe(() => {
      this.recomputeConversations();
    });
    this.runtimeSubscription.add(subscription);
  }

  private async ensureConversationMetadataForGroup(
    group: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>,
    fallbackParticipantPubkey?: string
  ): Promise<void> {
    if (this.conversationsById.has(group.idStr) || this.conversationAliases.has(group.idStr)) {
      return;
    }

    let participantPubkey = fallbackParticipantPubkey;

    if (!participantPubkey && group.history) {
      const rumors = await group.history.queryRumors({ limit: 10 });
      participantPubkey = rumors.find((rumor) => rumor.pubkey !== this.account?.pubkey)?.pubkey;
    }

    if (!participantPubkey) {
      return;
    }

    const participant = await this.resolveParticipantByPubkey(participantPubkey);
    await this.persistConversationRecord(group.idStr, participant);
  }

  private async attachGroupHistory(
    group: Awaited<ReturnType<MarmotClient<GroupRumorHistory>['getGroup']>>
  ): Promise<void> {
    if (!group.history || this.historyAbortControllers.has(group.idStr)) {
      return;
    }

    const abortController = new AbortController();
    this.historyAbortControllers.set(group.idStr, abortController);

    void (async () => {
      for await (const rumors of group.history!.subscribe()) {
        if (abortController.signal.aborted) {
          break;
        }

        await this.ensureConversationMetadataForGroup(group);
        const conversationId = this.resolveConversationId(group.idStr);
        const messages = await this.mapRumorsToMessages(conversationId, rumors);
        const existingMessages = this.messagesByConversation.get(conversationId) ?? [];

        this.messagesByConversation.set(
          conversationId,
          this.mergeMessages(existingMessages, messages)
        );
        if (conversationId !== group.idStr) {
          this.messagesByConversation.delete(group.idStr);
        }
        this.recomputeConversations();
      }
    })().catch((error) => {
      if (!abortController.signal.aborted) {
        logger.error('Failed to watch group history', error);
      }
    });
  }

  private async mapRumorsToMessages(
    conversationId: string,
    rumors: Rumor[]
  ): Promise<ChatMessage[]> {
    const chatRumors = rumors
      .filter((rumor) => rumor.kind === 9)
      .slice()
      .sort((a, b) => a.created_at - b.created_at);

    const messages = await Promise.all(
      chatRumors.map(async (rumor) => {
        const sender = await this.resolveParticipantByPubkey(rumor.pubkey);
        return {
          id: rumor.id,
          conversationId,
          content: rumor.content,
          createdAt: new Date(rumor.created_at * 1000).toISOString(),
          sender,
          isMine: rumor.pubkey === this.account?.pubkey,
          rumor,
        } satisfies ChatMessage;
      })
    );

    return messages;
  }

  private async resolveDirectParticipant(
    target: DirectConversationTarget
  ): Promise<ChatParticipant> {
    if (target.nostr_pubkey) {
      return {
        userId: target.userId,
        pubkey: target.nostr_pubkey,
        username: target.username ?? target.userId,
        name: target.name ?? target.username ?? target.userId,
        image: target.image,
        verificationStatus: target.verification_status ?? null,
        nip05: target.nip05,
      };
    }

    const fetched = await fetchMessagingUserById(target.userId);
    if (!fetched?.nostr_pubkey) {
      throw new Error('This user does not have secure chat set up yet');
    }

    return {
      userId: fetched.id,
      pubkey: fetched.nostr_pubkey,
      username: fetched.username,
      name: fetched.name,
      image: fetched.image,
      verificationStatus: fetched.verification_status ?? null,
      nip05: fetched.nip05,
    };
  }

  private async fetchLatestKeyPackageEvent(pubkey: string): Promise<NostrEvent | null> {
    if (!this.client) {
      return null;
    }

    const events = await this.client.network.request([...DEFAULT_CHAT_RELAYS], {
      authors: [pubkey],
      kinds: [KEY_PACKAGE_KIND],
      limit: 10,
    });

    const keyPackageEvents = events
      .filter((event) => event.kind === KEY_PACKAGE_KIND)
      .sort((a, b) => b.created_at - a.created_at);

    const latest = keyPackageEvents[0] ?? null;

    if (latest) {
      await this.client.keyPackages.track(latest);
    }

    return latest;
  }

  private async resolveParticipantByPubkey(pubkey: string): Promise<ChatParticipant> {
    if (pubkey === this.account?.pubkey) {
      return this.createCurrentUserParticipant(pubkey);
    }

    const cached =
      this.conversationsById.size > 0
        ? Array.from(this.conversationsById.values()).find(
            (conversation) => conversation.participant.pubkey === pubkey
          )?.participant
        : null;

    if (cached) {
      return cached;
    }

    const stored = await this.metadataStore.getParticipantByPubkey(pubkey);
    if (stored) {
      return stored;
    }

    const pending = this.participantLookupPromises.get(pubkey);
    if (pending) {
      return pending;
    }

    const lookup = (async () => {
      const resolved = await fetchMessagingUserByPubkey(pubkey);
      const participant: ChatParticipant = resolved
        ? {
            userId: resolved.id,
            pubkey,
            username: resolved.username,
            name: resolved.name,
            image: resolved.image,
            verificationStatus: resolved.verification_status ?? null,
            nip05: resolved.nip05,
          }
        : {
            userId: pubkey,
            pubkey,
            username: pubkey.slice(0, 8),
            name: pubkey.slice(0, 16),
            image: null,
            verificationStatus: null,
          };

      await this.metadataStore.saveParticipant(participant);
      return participant;
    })();

    this.participantLookupPromises.set(pubkey, lookup);

    try {
      return await lookup;
    } finally {
      this.participantLookupPromises.delete(pubkey);
    }
  }

  private async persistConversationRecord(
    conversationId: string,
    participant: ChatParticipant
  ): Promise<string> {
    const existingConversationId = await this.findConversationIdForParticipant(participant);
    if (existingConversationId && existingConversationId !== conversationId) {
      this.conversationAliases.set(conversationId, existingConversationId);
      return existingConversationId;
    }

    const record: ChatConversationRecord = {
      id: conversationId,
      type: 'direct',
      participant,
      createdAt: new Date().toISOString(),
    };

    this.conversationsById.set(conversationId, record);
    await this.metadataStore.saveConversation(record);
    return conversationId;
  }

  private createCurrentUserParticipant(pubkey: string): ChatParticipant {
    return {
      userId: this.authUser.id,
      pubkey,
      username: this.authUser.username,
      name: this.authUser.name,
      image: this.authUser.image,
      verificationStatus: this.authUser.verification_status ?? null,
      nip05: this.authUser.nip05,
    };
  }

  private recomputeConversations(): void {
    const unreadConversationIds = this.groupSubscriptionManager?.unreadConversationIds.value ?? [];
    const unreadSet = new Set(unreadConversationIds);

    const conversations: ChatConversation[] = Array.from(this.conversationsById.values())
      .map((record) => {
        const messages = this.messagesByConversation.get(record.id) ?? [];
        const lastMessage = messages[messages.length - 1] ?? null;

        return {
          id: record.id,
          type: record.type,
          participant: record.participant,
          lastMessageText: lastMessage?.content ?? null,
          lastMessageAt: lastMessage?.createdAt ?? null,
          unreadCount: unreadSet.has(record.id) ? 1 : 0,
        } satisfies ChatConversation;
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

    this.setSnapshot({
      ...this.snapshot,
      conversations,
      messagesByConversation: Object.fromEntries(this.messagesByConversation.entries()),
    });
  }

  private setSnapshot(next: ChatRuntimeSnapshot): void {
    this.snapshot = next;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private resolveConversationId(conversationId: string): string {
    return this.conversationAliases.get(conversationId) ?? conversationId;
  }

  private async findConversationIdForParticipant(
    participant: Pick<ChatParticipant, 'userId' | 'pubkey'>
  ): Promise<string | null> {
    const inMemory = Array.from(this.conversationsById.values()).find(
      (conversation) =>
        conversation.participant.userId === participant.userId ||
        conversation.participant.pubkey === participant.pubkey
    );
    if (inMemory) {
      return inMemory.id;
    }

    const byUserId = await this.metadataStore.getConversationIdByUserId(participant.userId);
    if (byUserId) {
      return this.resolveConversationId(byUserId);
    }

    const byPubkey = await this.metadataStore.getConversationIdByPubkey(participant.pubkey);
    if (byPubkey) {
      return this.resolveConversationId(byPubkey);
    }

    return null;
  }

  private mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
    const merged = new Map<string, ChatMessage>();

    for (const message of existing) {
      merged.set(message.id, message);
    }

    for (const message of incoming) {
      merged.set(message.id, message);
    }

    return Array.from(merged.values()).sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  }
}
