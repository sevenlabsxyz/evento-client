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
import { type Filter } from 'applesauce-core/helpers/filter';
import { nsecEncode } from 'applesauce-core/helpers/pointers';
import { mapEventsToTimeline } from 'applesauce-core/observable';
import { onlyEvents, RelayPool } from 'applesauce-relay';
import { lastValueFrom, Subscription, timeout, TimeoutError } from 'rxjs';

const emptySnapshot = (): ChatRuntimeSnapshot => ({
  status: 'idle',
  conversations: [],
  messagesByConversation: {},
  currentUserParticipant: null,
  error: null,
});

const RELAY_REQUEST_TIMEOUT_MS = 12_000;

class RelayRequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Secure chat relays did not respond in time (${Math.floor(timeoutMs / 1000)}s)`);
    this.name = 'RelayRequestTimeoutError';
  }
}

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
    logger.warn('Chat runtime: start requested');
    try {
      const storedAccount = await this.metadataStore.getAccount();
      const onboardingComplete = await this.metadataStore.getOnboardingComplete();
      logger.warn('Chat runtime: local onboarding state', {
        hasStoredAccount: !!storedAccount,
        onboardingComplete,
      });

      if (!storedAccount || !onboardingComplete) {
        logger.warn('Chat runtime: needs onboarding');
        this.setSnapshot({
          ...emptySnapshot(),
          status: 'needs-onboarding',
        });
        return;
      }

      this.account = PrivateKeyAccount.fromJSON(storedAccount as SerializedAccount);
      logger.warn('Chat runtime: account restored', { pubkey: this.account.pubkey });
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
    logger.warn('Chat runtime: completeOnboarding started');
    try {
      const account = PrivateKeyAccount.generateNew();
      logger.warn('Chat runtime: generated account during onboarding', {
        pubkey: account.pubkey,
      });
      await this.metadataStore.setAccount(account.toJSON());
      await this.metadataStore.setOnboardingComplete(true);
      this.account = account;
      await this.initializeClient();
      logger.warn('Chat runtime: completeOnboarding finished', {
        pubkey: account.pubkey,
      });
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

  getSecretKeyNsec(): string | null {
    if (!this.account) {
      return null;
    }

    try {
      return nsecEncode(this.account.signer.key);
    } catch (error) {
      logger.error('Failed to encode chat secret key', error);
      return null;
    }
  }

  async openDirectConversation(target: DirectConversationTarget): Promise<string> {
    logger.warn('Chat runtime: openDirectConversation called', {
      targetUserId: target.userId,
      targetUsername: target.username,
      hasTargetPubkey: !!target.nostr_pubkey,
    });

    if (!this.client || !this.account) {
      throw new Error('Chat is not ready yet');
    }

    try {
      const participant = await this.resolveDirectParticipant(target);
      logger.warn('Chat runtime: resolved direct participant', {
        userId: participant.userId,
        pubkey: participant.pubkey,
      });

      const existingConversationId = await this.findConversationIdForParticipant(participant);
      logger.warn('Chat runtime: existing conversation lookup', {
        userId: participant.userId,
        existingConversationId,
      });

      if (existingConversationId) {
        logger.warn('Chat runtime: reusing existing conversation', {
          conversationId: existingConversationId,
        });
        return existingConversationId;
      }

      const keyPackageEvent = await this.fetchLatestKeyPackageEvent(participant.pubkey);
      logger.warn('Chat runtime: fetched key package', {
        userId: participant.userId,
        pubkey: participant.pubkey,
        keyPackageFound: !!keyPackageEvent,
      });

      if (!keyPackageEvent) {
        logger.warn('Chat runtime: no key package found for participant', {
          userId: participant.userId,
          pubkey: participant.pubkey,
        });
        throw new Error(`${participant.username} has not set up chat yet`);
      }

      const group = await this.client.createGroup(participant.username, {
        description: `Direct messages with ${participant.username}`,
        relays: [...DEFAULT_CHAT_RELAYS],
      });
      logger.warn('Chat runtime: group created', {
        conversationId: group.idStr,
        participantUsername: participant.username,
        relays: [...DEFAULT_CHAT_RELAYS],
      });

      await group.inviteByKeyPackageEvent(keyPackageEvent);
      logger.warn('Chat runtime: sent invite by key package', {
        conversationId: group.idStr,
        pubkey: participant.pubkey,
      });

      const conversationId = await this.persistConversationRecord(group.idStr, participant);
      await this.attachGroupHistory(group);
      this.recomputeConversations();
      logger.warn('Chat runtime: conversation persisted and history attached', {
        conversationId,
      });
      return conversationId;
    } catch (error) {
      logger.error('Chat runtime: openDirectConversation failed', {
        targetUserId: target.userId,
        error,
      });
      throw error;
    }
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
    logger.warn('Chat runtime: sending message', {
      conversationId: this.resolveConversationId(conversationId),
      hasContent: !!trimmed,
    });
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
    for (const threadConversationId of this.getConversationThreadIds(resolvedConversationId)) {
      this.groupSubscriptionManager.markConversationSeen(threadConversationId, seenAtSeconds);
    }
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
    const configuredRelays = [...DEFAULT_CHAT_RELAYS];
    const requestFromRelays = async (
      relays: string[],
      filters: Filter | Filter[]
    ): Promise<NostrEvent[]> => {
      const requestFilters = Array.isArray(filters) ? filters : [filters];
      const isKeyPackageLookup = requestFilters.some((filter) =>
        (filter.kinds ?? []).includes(KEY_PACKAGE_KIND)
      );
      const requestTimelineFromRelays = async (requestRelays: string[]): Promise<NostrEvent[]> => {
        try {
          return await lastValueFrom(
            pool
              .request(requestRelays, filters)
              .pipe(mapEventsToTimeline(), timeout(RELAY_REQUEST_TIMEOUT_MS))
          );
        } catch (error) {
          if (error instanceof TimeoutError) {
            logger.warn('Chat runtime: network request timed out', {
              relayCount: requestRelays.length,
              kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
              timeoutMs: RELAY_REQUEST_TIMEOUT_MS,
              relayUrl: requestRelays,
            });
            throw new RelayRequestTimeoutError(RELAY_REQUEST_TIMEOUT_MS);
          }
          throw error;
        }
      };

      if (isKeyPackageLookup) {
        logger.warn('Chat runtime: network request first-success mode', {
          relayCount: relays.length,
          kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
          authors: requestFilters.map((filter: { authors?: string[] }) => filter.authors),
          relayUrl: relays,
        });

        try {
          const firstSuccessfulRelay = await Promise.any(
            relays.map(async (relay) => {
              const relayEvents = await requestTimelineFromRelays([relay]);
              logger.warn('Chat runtime: network request relay completed (first-success mode)', {
                relay,
                relayEventCount: relayEvents.length,
                kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
              });
              return { relay, relayEvents };
            })
          );

          logger.warn('Chat runtime: network request first-success selected relay', {
            selectedRelay: firstSuccessfulRelay.relay,
            resultCount: firstSuccessfulRelay.relayEvents.length,
            kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
          });
          return firstSuccessfulRelay.relayEvents;
        } catch (error) {
          const relayErrors = error instanceof AggregateError ? error.errors : [error as unknown];
          const allRelayFailuresTimedOut =
            relayErrors.length > 0 &&
            relayErrors.every((entry) => entry instanceof RelayRequestTimeoutError);

          logger.error('Chat runtime: network request failed in first-success mode', {
            relayCount: relays.length,
            kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
            relayErrorCount: relayErrors.length,
            relayErrors,
          });

          throw allRelayFailuresTimedOut
            ? new Error(`Secure chat relays are timing out. Please try again in a few seconds.`)
            : error;
        }
      }

      logger.warn('Chat runtime: network request batch requested', {
        relayCount: relays.length,
        kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
        authors: requestFilters.map((filter: { authors?: string[] }) => filter.authors),
        relayUrl: relays,
      });

      try {
        const events = await requestTimelineFromRelays(relays);
        logger.warn('Chat runtime: network request batch completed', {
          relayCount: relays.length,
          kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
          resultCount: events.length,
          relayUrl: relays,
        });
        return events;
      } catch (error) {
        logger.warn('Chat runtime: network request batch failed, trying relay fallback', {
          relayCount: relays.length,
          kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
          error,
          relayUrl: relays,
        });

        const fallbackEvents: NostrEvent[] = [];
        const successfulRelays: string[] = [];
        const requestErrorMap: Array<{ relay: string; error: unknown }> = [];

        await Promise.all(
          relays.map(async (relay) => {
            try {
              const relayEvents = await requestTimelineFromRelays([relay]);
              logger.warn('Chat runtime: network request relay fallback completed', {
                relay,
                relayEventCount: relayEvents.length,
                kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
              });
              fallbackEvents.push(...relayEvents);
              successfulRelays.push(relay);
            } catch (relayError) {
              requestErrorMap.push({ relay, error: relayError });
              logger.warn('Chat runtime: network request relay fallback failed', {
                relay,
                relayError,
                kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
              });
            }
          })
        );

        if (!fallbackEvents.length) {
          const allRelayFailuresTimedOut =
            requestErrorMap.length > 0 &&
            requestErrorMap.every((entry) => entry.error instanceof RelayRequestTimeoutError);
          logger.error('Chat runtime: network request failed after relay fallback', {
            relayCount: relays.length,
            kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
            relayErrorCount: requestErrorMap.length,
            relayErrors: requestErrorMap.map((entry) => entry.error),
          });
          throw allRelayFailuresTimedOut
            ? new Error(`Secure chat relays are timing out. Please try again in a few seconds.`)
            : error;
        }

        const uniqueEvents = Array.from(
          new Map(fallbackEvents.map((event) => [event.id, event])).values()
        );
        logger.warn('Chat runtime: network request fallback used', {
          relayCount: relays.length,
          kinds: requestFilters.map((filter: { kinds?: number[] }) => filter.kinds),
          fallbackEventCount: uniqueEvents.length,
          successfulFallbackRelays: successfulRelays,
        });
        return uniqueEvents;
      }
    };

    const network: NostrNetworkInterface = {
      publish: async (relays, event) => {
        logger.warn('Chat runtime: network publish requested', {
          eventKind: event.kind,
          eventId: event.id,
          relayCount: relays.length,
          configuredRelayCount: configuredRelays.length,
        });

        try {
          const firstSuccessfulPublish = await Promise.any(
            relays.map(async (relay) => {
              const result = await pool.relay(relay).publish(event);
              logger.warn('Chat runtime: network publish relay completed (first-success mode)', {
                relay,
                eventId: event.id,
                ok: result.ok,
              });
              if (!result.ok) {
                throw new Error(result.message || `Relay ${relay} rejected event`);
              }
              return { relay, result };
            })
          );

          const publishResult: Record<string, PublishResponse> = {
            [firstSuccessfulPublish.relay]: firstSuccessfulPublish.result,
          };
          logger.warn('Chat runtime: network publish completed', {
            eventId: event.id,
            relayCount: relays.length,
            publishResponseCount: 1,
            acceptedRelays: Object.keys(publishResult),
          });
          return publishResult;
        } catch (error) {
          const relayErrors = error instanceof AggregateError ? error.errors : [error as unknown];
          logger.error('Chat runtime: network publish failed', {
            eventKind: event.kind,
            eventId: event.id,
            relays,
            relayErrorCount: relayErrors.length,
            relayErrors,
          });
          throw new Error('Failed to publish to any secure chat relay');
        }
      },
      request: async (relays, filters) => requestFromRelays([...relays], filters),
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
    logger.warn('Chat runtime: marmot services initialized', {
      accountPubkey: this.account.pubkey,
      relays: [...DEFAULT_CHAT_RELAYS],
    });

    await this.metadataStore.saveParticipant(
      this.createCurrentUserParticipant(this.account.pubkey)
    );
    void syncMessagingIdentity(this.createCurrentUserParticipant(this.account.pubkey)).catch(
      (error) => {
        logger.warn('Failed to sync messaging identity', error);
      }
    );

    logger.warn('Chat runtime: loading Marmot groups');
    await client.loadAllGroups();
    logger.warn('Chat runtime: ensuring key package');
    await this.ensureKeyPackage();
    logger.warn('Chat runtime: restoring conversation metadata');
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

    logger.warn('Chat runtime: checking existing key packages');
    const existingPackages = await this.client.keyPackages.list();
    logger.warn('Chat runtime: existing key package count', {
      total: existingPackages.length,
      usable: existingPackages.filter(
        (keyPackage) => keyPackage.published.length > 0 && !keyPackage.used
      ).length,
    });
    const hasInvitableKeyPackage = existingPackages.some(
      (keyPackage) => keyPackage.published.length > 0 && !keyPackage.used
    );

    if (hasInvitableKeyPackage) {
      return;
    }

    logger.warn('Chat runtime: creating key package');
    await this.client.keyPackages.create({
      relays: [...DEFAULT_CHAT_RELAYS],
      client: CHAT_KEY_PACKAGE_CLIENT,
    });
    logger.warn('Chat runtime: key package created', {
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
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
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
          logger.debug('Chat runtime: watchGroups update', {
            groupId: group.idStr,
            relays: [...DEFAULT_CHAT_RELAYS],
          });
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
          logger.debug('Chat runtime: invite event received', {
            eventId: event.id,
          });
          void this.handleInviteEvent(event);
        },
      });

    this.runtimeSubscription.add(subscription);
  }

  private async handleInviteEvent(event: NostrEvent): Promise<void> {
    if (!this.inviteReader || !this.client) {
      return;
    }

    try {
      const ingested = await this.inviteReader.ingestEvent(event);
      if (!ingested) {
        return;
      }
      logger.debug('Chat runtime: invite ingested', { eventId: event.id });

      const invite = await this.inviteReader.decryptGiftWrap(event.id);
      if (!invite) {
        return;
      }
      logger.debug('Chat runtime: invite decrypted', {
        inviteId: invite.id,
        eventId: event.id,
      });

      const { group } = await this.client.joinGroupFromWelcome({
        welcomeRumor: invite,
      });
      await this.inviteReader.markAsRead(invite.id);
      await this.ensureConversationMetadataForGroup(group, invite.pubkey);
      await this.attachGroupHistory(group);
      this.recomputeConversations();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('No matching KeyPackage found in local store')) {
        logger.warn('Chat runtime: ignoring invite without matching local key package', {
          eventId: event.id,
          message,
        });
        return;
      }
      logger.error('Chat runtime: failed to handle invite event', {
        eventId: event.id,
        error,
      });
    }
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
      logger.debug('Chat runtime: unable to resolve participant pubkey for group history', {
        groupId: group.idStr,
      });
      return;
    }

    const participant = await this.resolveParticipantByPubkey(participantPubkey);
    logger.debug('Chat runtime: resolving participant for group metadata', {
      groupId: group.idStr,
      participantId: participant.userId,
      participantPubkey,
    });
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
      logger.debug('Chat runtime: attaching group history subscription', { groupId: group.idStr });
      for await (const rumors of group.history!.subscribe()) {
        if (abortController.signal.aborted) {
          break;
        }

        await this.ensureConversationMetadataForGroup(group);
        const conversationId = this.resolveConversationId(group.idStr);
        const messages = await this.mapRumorsToMessages(conversationId, rumors);
        logger.debug('Chat runtime: received rumors', {
          conversationId,
          rumorCount: rumors.length,
          messageCount: messages.length,
        });
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
        logger.debug('Chat runtime: mapping rumor to message', {
          rumorId: rumor.id,
          pubkey: rumor.pubkey,
          kind: rumor.kind,
        });
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
      logger.warn('Chat runtime: using provided nostr pubkey from target', {
        userId: target.userId,
        pubkey: target.nostr_pubkey,
      });
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
      logger.warn('Chat runtime: target user missing nostr pubkey after details lookup', {
        userId: target.userId,
      });
      throw new Error('This user does not have secure chat set up yet');
    }
    logger.warn('Chat runtime: fetched direct participant', {
      userId: target.userId,
      resolvedPubkey: fetched.nostr_pubkey,
    });

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

    logger.warn('Chat runtime: fetching key package events', {
      pubkey,
      relays: [...DEFAULT_CHAT_RELAYS],
    });
    let events: NostrEvent[] = [];

    try {
      events = await this.client.network.request([...DEFAULT_CHAT_RELAYS], {
        authors: [pubkey],
        kinds: [KEY_PACKAGE_KIND],
        limit: 10,
      });
    } catch (error) {
      logger.error('Chat runtime: failed to fetch key package events', {
        pubkey,
        error,
      });
      throw error;
    }

    const keyPackageEvents = events
      .filter((event) => event.kind === KEY_PACKAGE_KIND)
      .sort((a, b) => b.created_at - a.created_at);

    const latest = keyPackageEvents[0] ?? null;

    logger.warn('Chat runtime: key package lookup result', {
      pubkey,
      totalCandidates: events.length,
      matchingKeyPackages: keyPackageEvents.length,
      latestId: latest?.id,
      latestCreatedAt: latest?.created_at,
    });

    if (latest) {
      await this.client.keyPackages.track(latest);
    }

    return latest;
  }

  private async resolveParticipantByPubkey(pubkey: string): Promise<ChatParticipant> {
    if (pubkey === this.account?.pubkey) {
      logger.debug('Chat runtime: resolveParticipantByPubkey is current user', { pubkey });
      return this.createCurrentUserParticipant(pubkey);
    }

    const cached =
      this.conversationsById.size > 0
        ? Array.from(this.conversationsById.values()).find(
            (conversation) => conversation.participant.pubkey === pubkey
          )?.participant
        : null;

    if (cached) {
      logger.debug('Chat runtime: resolveParticipantByPubkey from memory', { pubkey });
      return cached;
    }

    const stored = await this.metadataStore.getParticipantByPubkey(pubkey);
    if (stored) {
      logger.debug('Chat runtime: resolveParticipantByPubkey from metadata store', {
        pubkey,
        userId: stored.userId,
      });
      return stored;
    }

    const pending = this.participantLookupPromises.get(pubkey);
    if (pending) {
      return pending;
    }

    const lookup = (async () => {
      const resolved = await fetchMessagingUserByPubkey(pubkey);
      logger.debug('Chat runtime: resolveParticipantByPubkey API lookup result', {
        pubkey,
        found: !!resolved,
        userId: resolved?.id,
      });
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
      logger.debug('Chat runtime: resolved and cached participant', {
        pubkey,
        userId: participant.userId,
      });
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
      const previousCanonicalId = this.resolveConversationId(existingConversationId);
      if (previousCanonicalId !== conversationId) {
        const previousMessages = this.messagesByConversation.get(previousCanonicalId) ?? [];
        const currentMessages = this.messagesByConversation.get(conversationId) ?? [];

        this.conversationAliases.set(previousCanonicalId, conversationId);
        this.conversationsById.delete(previousCanonicalId);

        if (previousMessages.length > 0 || currentMessages.length > 0) {
          this.messagesByConversation.set(
            conversationId,
            this.mergeMessages(previousMessages, currentMessages)
          );
          this.messagesByConversation.delete(previousCanonicalId);
        }
      }
    }

    const record: ChatConversationRecord = {
      id: conversationId,
      type: 'direct',
      participant,
      createdAt: new Date().toISOString(),
    };

    this.conversationsById.set(conversationId, record);
    await this.metadataStore.saveConversation(record);
    logger.debug('Chat runtime: persisted conversation record', {
      conversationId,
      participantUserId: participant.userId,
      participantPubkey: participant.pubkey,
    });
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
    logger.debug('Chat runtime: recomputing conversations', {
      recordCount: this.conversationsById.size,
      messageThreadCount: this.messagesByConversation.size,
    });
    const unreadConversationIds = this.groupSubscriptionManager?.unreadConversationIds.value ?? [];
    const unreadSet = new Set(
      unreadConversationIds.map((conversationId) => this.resolveConversationId(conversationId))
    );

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
    const previousStatus = this.snapshot.status;
    const previousError = this.snapshot.error;
    const nextError = next.error;
    if (previousStatus !== next.status || previousError !== nextError) {
      logger.warn('Chat runtime: snapshot updated', {
        previousStatus,
        nextStatus: next.status,
        previousError,
        nextError,
      });
    }

    this.snapshot = next;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private resolveConversationId(conversationId: string): string {
    let resolvedConversationId = conversationId;
    const visited = new Set<string>();

    while (!visited.has(resolvedConversationId)) {
      visited.add(resolvedConversationId);
      const nextConversationId = this.conversationAliases.get(resolvedConversationId);
      if (!nextConversationId) {
        return resolvedConversationId;
      }
      resolvedConversationId = nextConversationId;
    }

    return resolvedConversationId;
  }

  private getConversationThreadIds(conversationId: string): string[] {
    const resolvedConversationId = this.resolveConversationId(conversationId);
    const threadConversationIds = new Set([resolvedConversationId]);

    for (const aliasConversationId of this.conversationAliases.keys()) {
      if (this.resolveConversationId(aliasConversationId) === resolvedConversationId) {
        threadConversationIds.add(aliasConversationId);
      }
    }

    return Array.from(threadConversationIds);
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
