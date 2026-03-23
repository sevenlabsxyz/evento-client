import { fetchUserByUsername } from '@/lib/services/user-profile';
import type { VerificationStatus } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export interface EventoCashProfile {
  username: string;
  displayName: string;
  avatar: string;
  verification_status?: VerificationStatus;
}

export function useEventoCashProfile(lightningAddress: string | undefined) {
  const username =
    lightningAddress && lightningAddress.endsWith('@evento.cash')
      ? lightningAddress.split('@')[0] || ''
      : '';

  return useQuery<EventoCashProfile | null>({
    queryKey: ['wallet', 'evento-cash-profile', username],
    queryFn: async () => {
      const user = await fetchUserByUsername(username);

      if (!user) {
        return null;
      }

      return {
        username: user.username,
        displayName: user.name || user.username,
        avatar: user.image || '',
        verification_status: user.verification_status,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!username,
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number };
        if (apiError.status === 404) return false;
      }
      return failureCount < 3;
    },
  });
}
