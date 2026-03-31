'use client';

import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
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

// Custom error class for RSVP failures with redirect
export class RSVPError extends Error {
  redirectTo?: string;
  status?: number;

  constructor(message: string, redirectTo?: string, status?: number) {
    super(message);
    this.name = 'RSVPError';
    this.redirectTo = redirectTo;
    this.status = status;
  }
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
        const errorData = error as { message?: string; redirectTo?: string; status?: number };
        const message = errorData.message || 'Failed to update RSVP';
        const redirectTo = errorData.redirectTo;
        const statusCode = errorData.status;

        console.error('[RSVP] API error:', { eventId, status, hasExisting, error });
        throw new RSVPError(message, redirectTo, statusCode);
      }

      if (!res?.success) {
        console.error('[RSVP] Unsuccessful response:', { eventId, status, hasExisting, res });
        throw new Error(res?.message || 'Failed to update RSVP');
      }
      const arr = res?.data ?? [];
      return Array.isArray(arr) && arr.length > 0 ? (arr[0] as EventRSVP) : null;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userRsvp(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventRsvps(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: ['event', 'details', variables.eventId] });
    },
  });
}
