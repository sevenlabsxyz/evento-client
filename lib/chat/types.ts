import type { Rumor } from 'applesauce-common/helpers/gift-wrap';
import type { VerificationStatus } from '@/lib/types/api';

export type ChatStatus = 'idle' | 'needs-onboarding' | 'initializing' | 'ready' | 'error';

export interface ChatParticipant {
  userId: string;
  pubkey: string;
  username: string;
  name: string;
  image?: string | null;
  verificationStatus: VerificationStatus;
  nip05?: string;
}

export interface ChatConversationRecord {
  id: string;
  type: 'direct';
  participant: ChatParticipant;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  type: 'direct';
  participant: ChatParticipant;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  sender: ChatParticipant;
  isMine: boolean;
  rumor: Rumor;
}

export interface ChatRuntimeSnapshot {
  status: ChatStatus;
  conversations: ChatConversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  currentUserParticipant: ChatParticipant | null;
  error: string | null;
}
