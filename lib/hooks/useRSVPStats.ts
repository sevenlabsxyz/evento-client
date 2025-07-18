'use client';

import { apiClient } from '@/lib/api/client';
import {
  ApiResponse,
  EmailBlastRecipientFilter,
  EventRSVP,
} from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { useQuery } from '@tanstack/react-query';

export interface RSVPStats {
  total: number;
  yes: number;
  no: number;
  maybe: number;
  yes_and_maybe: number;
}

/**
 * Hook to fetch RSVP statistics for an event
 */
export function useRSVPStats(eventId: string) {
  return useQuery({
    queryKey: ['rsvpStats', eventId],
    queryFn: async (): Promise<RSVPStats> => {
      try {
        // Fetch RSVPs using the correct API endpoint with query parameter
        const response = await apiClient.get<ApiResponse<EventRSVP[]>>(
          `/v1/events/rsvps?id=${eventId}`
        );

        if (response && response.data && Array.isArray(response.data)) {
          const rsvps = response.data;
          const stats: RSVPStats = {
            total: rsvps.length,
            yes: rsvps.filter((rsvp) => rsvp.status === 'yes').length,
            no: rsvps.filter((rsvp) => rsvp.status === 'no').length,
            maybe: rsvps.filter((rsvp) => rsvp.status === 'maybe').length,
            yes_and_maybe: 0,
          };

          stats.yes_and_maybe = stats.yes + stats.maybe;

          return stats;
        }
      } catch (error) {
        console.log('RSVP endpoint error:', error);
        toast.error('Failed to fetch RSVP stats');
      }

      // Fallback: return default stats when no RSVPs or API error
      return {
        total: 0,
        yes: 0,
        no: 0,
        maybe: 0,
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
      return stats.total;
    case 'rsvp-yes':
      return stats.yes;
    case 'rsvp-no':
      return stats.no;
    case 'rsvp-maybe':
      return stats.maybe;
    case 'invited':
      return stats.total; // Assuming all people in the stats are invited
    default:
      return 0;
  }
}
