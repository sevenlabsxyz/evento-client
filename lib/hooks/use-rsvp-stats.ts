'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, EmailBlastRecipientFilter, EventRSVP } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export interface RSVPStats {
  all: number;
  yes_only: number;
  yes_and_maybe: number;
}

/**
 * Hook to fetch RSVP statistics for an event
 */
export function useRSVPStats(eventId: string) {
  return useQuery({
    queryKey: ['rsvpStats', eventId],
    queryFn: async (): Promise<RSVPStats> => {
      // Fetch RSVPs using the correct API endpoint with query parameter
      const response = await apiClient.get<ApiResponse<EventRSVP[]>>(
        `/v1/events/rsvps?event_id=${eventId}`
      );

      if (response && response.data && Array.isArray(response.data)) {
        const rsvps = response.data;
        const stats: RSVPStats = {
          all: rsvps.length,
          yes_only: rsvps.filter((rsvp) => rsvp.status === 'yes').length,
          yes_and_maybe: rsvps.filter((rsvp) => rsvp.status === 'maybe').length,
        };

        return stats;
      }

      // Fallback: return default stats when no RSVPs or API error
      return {
        all: 0,
        yes_only: 0,
        yes_and_maybe: 0,
      };
    },
    enabled: !!eventId,
    // Cache for 5 minutes since RSVP data doesn't change frequently
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get recipient count for a specific filter type
 */
export function getRecipientCount(
  stats: RSVPStats | undefined,
  filter: EmailBlastRecipientFilter
): number {
  if (!stats) return 0;

  switch (filter) {
    case 'all':
      return stats.all;
    case 'yes_only':
      return stats.yes_only;
    case 'yes_and_maybe':
      return stats.yes_and_maybe;
    default:
      return 0;
  }
}
