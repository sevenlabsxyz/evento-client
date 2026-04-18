import { apiClient } from '@/lib/api/client';
import type { ChatParticipant } from '@/lib/chat/types';
import type { ApiResponse, UserDetails } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

type UserDetailsResponse = ApiResponse<UserDetails> | UserDetails;

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export interface MessagingUserDetails extends UserDetails {
  nostr_pubkey?: string;
}

export async function fetchMessagingUserById(userId: string): Promise<MessagingUserDetails | null> {
  if (!userId) {
    return null;
  }

  logger.warn('Chat API: fetching user by id', { userId });
  const response = await apiClient.get<UserDetailsResponse>(
    `/v1/user/details?id=${encodeURIComponent(userId)}`
  );
  const user = isApiResponse<UserDetails>(response) ? response.data : response;
  logger.warn('Chat API: fetched user by id', {
    userId,
    found: !!user,
    hasNostrPubkey: !!user?.nostr_pubkey,
    username: user?.username,
  });
  return user && user.id ? (user as MessagingUserDetails) : null;
}

export async function fetchMessagingUserByPubkey(
  pubkey: string
): Promise<MessagingUserDetails | null> {
  if (!pubkey) {
    return null;
  }

  logger.warn('Chat API: fetching user by nostr pubkey', { pubkey });
  const response = await apiClient.get<UserDetailsResponse>(
    `/v1/user/details?nostr_pubkey=${encodeURIComponent(pubkey)}`,
    {
      suppressErrorStatuses: [404],
    }
  );
  const user = isApiResponse<UserDetails>(response) ? response.data : response;
  logger.warn('Chat API: fetched user by nostr pubkey', {
    pubkey,
    found: !!user,
    userId: user?.id,
  });
  return user && user.id ? (user as MessagingUserDetails) : null;
}

export async function syncMessagingIdentity(participant: ChatParticipant): Promise<void> {
  logger.warn('Chat API: syncing nostr pubkey', {
    userId: participant.userId,
    pubkey: participant.pubkey,
    username: participant.username,
  });
  await apiClient.patch('/v1/user', {
    nostr_pubkey: participant.pubkey,
  });
  logger.warn('Chat API: synced nostr pubkey', {
    userId: participant.userId,
    pubkey: participant.pubkey,
  });
}
