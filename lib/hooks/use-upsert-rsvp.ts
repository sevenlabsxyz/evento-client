'use client';

import { apiClient } from '@/lib/api/client';
import { EventRSVP, RSVPStatus } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpsertRSVPArgs {
  eventId: string;
  status: RSVPStatus;
  hasExisting: boolean;
}

interface UpsertRSVPResponse {
  success: boolean;
  message: string;
  data: EventRSVP[];
}

export function useUpsertRSVP() {
  const queryClient = useQueryClient();

  return useMutation<EventRSVP | null, Error, UpsertRSVPArgs>({
    mutationFn: async ({ eventId, status, hasExisting }) => {
      const body = { event_id: eventId, status };
      let res: UpsertRSVPResponse;

      try {
        if (hasExisting) {
          res = await apiClient.patch<UpsertRSVPResponse>(`/v1/events/${eventId}/rsvps`, body);
        } else {
          res = await apiClient.post<UpsertRSVPResponse>(`/v1/events/${eventId}/rsvps`, body);
        }
      } catch (error: unknown) {
        const message =
          typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message)
            : 'Failed to update RSVP';

        if (message === 'This event has reached its capacity.') {
          throw new Error(message);
        }

        throw new Error('Failed to update RSVP');
      }

      if (!res?.success) {
        throw new Error(
          res?.message === 'This event has reached its capacity.'
            ? res?.message
            : 'Failed to update RSVP'
        );
      }
      const arr = res?.data ?? [];
      return Array.isArray(arr) && arr.length > 0 ? (arr[0] as EventRSVP) : null;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the current user RSVP for this event
      queryClient.invalidateQueries({
        queryKey: ['event', 'user-rsvp', variables.eventId],
      });
    },
  });
}
