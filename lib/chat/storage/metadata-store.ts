import { CHAT_STORAGE_KEYS } from '@/lib/chat/constants';
import type { ChatConversationRecord, ChatParticipant } from '@/lib/chat/types';
import type { SerializedAccount } from 'applesauce-accounts';
import localforage from 'localforage';

const conversationKey = (conversationId: string) => `conversation:${conversationId}`;
const participantByUserIdKey = (userId: string) => `participant-user:${userId}`;
const participantByPubkeyKey = (pubkey: string) => `participant-pubkey:${pubkey}`;
const conversationByUserIdKey = (userId: string) => `direct-user:${userId}`;
const conversationByPubkeyKey = (pubkey: string) => `direct-pubkey:${pubkey}`;

export class ChatMetadataStore {
  private readonly store: LocalForage;

  constructor(userId: string) {
    this.store = localforage.createInstance({
      name: `evento-chat-meta-${userId}`,
      storeName: 'metadata',
    });
  }

  async getAccount(): Promise<SerializedAccount | null> {
    return this.store.getItem<SerializedAccount>(CHAT_STORAGE_KEYS.account);
  }

  async setAccount(account: SerializedAccount): Promise<void> {
    await this.store.setItem(CHAT_STORAGE_KEYS.account, account);
  }

  async getOnboardingComplete(): Promise<boolean> {
    return (await this.store.getItem<boolean>(CHAT_STORAGE_KEYS.onboardingComplete)) ?? false;
  }

  async setOnboardingComplete(value: boolean): Promise<void> {
    await this.store.setItem(CHAT_STORAGE_KEYS.onboardingComplete, value);
  }

  async saveParticipant(participant: ChatParticipant): Promise<void> {
    await Promise.all([
      this.store.setItem(participantByUserIdKey(participant.userId), participant),
      this.store.setItem(participantByPubkeyKey(participant.pubkey), participant),
    ]);
  }

  async getParticipantByUserId(userId: string): Promise<ChatParticipant | null> {
    return this.store.getItem<ChatParticipant>(participantByUserIdKey(userId));
  }

  async getParticipantByPubkey(pubkey: string): Promise<ChatParticipant | null> {
    return this.store.getItem<ChatParticipant>(participantByPubkeyKey(pubkey));
  }

  async saveConversation(record: ChatConversationRecord): Promise<void> {
    await this.saveParticipant(record.participant);
    await Promise.all([
      this.store.setItem(conversationKey(record.id), record),
      this.store.setItem(conversationByUserIdKey(record.participant.userId), record.id),
      this.store.setItem(conversationByPubkeyKey(record.participant.pubkey), record.id),
    ]);
  }

  async getConversation(conversationId: string): Promise<ChatConversationRecord | null> {
    return this.store.getItem<ChatConversationRecord>(conversationKey(conversationId));
  }

  async getConversationIdByUserId(userId: string): Promise<string | null> {
    return this.store.getItem<string>(conversationByUserIdKey(userId));
  }

  async getConversationIdByPubkey(pubkey: string): Promise<string | null> {
    return this.store.getItem<string>(conversationByPubkeyKey(pubkey));
  }

  async listConversations(): Promise<ChatConversationRecord[]> {
    const records: ChatConversationRecord[] = [];

    await this.store.iterate<ChatConversationRecord, void>((value, key) => {
      if (key.startsWith('conversation:')) {
        records.push(value);
      }
    });

    return records;
  }
}
