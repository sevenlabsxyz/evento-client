'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, EventRSVP, RSVPStatus } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';

interface UpsertRSVPArgs {
  eventId: string;
  status: RSVPStatus;
  hasExisting: boolean;
}

export function useUpsertRSVP() {
  const queryClient = useQueryClient();

  return useMutation<EventRSVP | null, Error, UpsertRSVPArgs>({
    mutationFn: async ({ eventId, status, hasExisting }) => {
      const body = { event_id: eventId, status };
      let res: AxiosResponse<ApiResponse<EventRSVP[]>>;
      if (hasExisting) {
        res = await apiClient.patch<ApiResponse<EventRSVP[]>>('/v1/events/rsvps', body);
      } else {
        res = await apiClient.post<ApiResponse<EventRSVP[]>>('/v1/events/rsvps', body);
      }
      const payload = res.data;
      if (!payload?.success) {
        // Surface backend message (e.g., capacity reached)
        throw new Error(payload?.message || 'Failed to update RSVP');
      }
      const arr = payload?.data ?? [];
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
