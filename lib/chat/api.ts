import { apiClient } from '@/lib/api/client';
import type { ApiResponse, UserDetails } from '@/lib/types/api';
import type { ChatParticipant } from '@/lib/chat/types';

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

  const response = await apiClient.get<UserDetailsResponse>(
    `/v1/user/details?id=${encodeURIComponent(userId)}`
  );
  const user = isApiResponse<UserDetails>(response) ? response.data : response;
  return user && user.id ? (user as MessagingUserDetails) : null;
}

export async function fetchMessagingUserByPubkey(
  pubkey: string
): Promise<MessagingUserDetails | null> {
  if (!pubkey) {
    return null;
  }

  const response = await apiClient.get<UserDetailsResponse>(
    `/v1/user/details?nostr_pubkey=${encodeURIComponent(pubkey)}`,
    {
      suppressErrorStatuses: [404],
    }
  );
  const user = isApiResponse<UserDetails>(response) ? response.data : response;
  return user && user.id ? (user as MessagingUserDetails) : null;
}

export async function syncMessagingIdentity(participant: ChatParticipant): Promise<void> {
  await apiClient.patch('/v1/user', {
    nostr_pubkey: participant.pubkey,
  });
}
