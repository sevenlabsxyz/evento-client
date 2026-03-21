import {
  EventoCashProfileService,
  type EventoCashProfile,
} from '@/lib/services/evento-cash-profile';
import { useQuery } from '@tanstack/react-query';

export function useEventoCashProfile(lightningAddress: string | undefined) {
  return useQuery<EventoCashProfile | null>({
    queryKey: ['eventoCashProfile', lightningAddress],
    queryFn: () => EventoCashProfileService.fetchProfile(lightningAddress!),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!lightningAddress && lightningAddress.endsWith('@evento.cash'),
  });
}
