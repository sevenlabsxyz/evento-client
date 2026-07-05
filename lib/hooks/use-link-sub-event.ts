'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LinkSubEventParams {
  parentEventId: string;
  subEventId: string;
}

interface LinkSubEventResponse {
  id: string;
  parent_event_id: string;
}

/**
 * Links an existing event as a sub-event of a parent event.
 * Both events must be hosted by the current user.
 */
export function useLinkSubEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentEventId, subEventId }: LinkSubEventParams) => {
      const response = await apiClient.post<ApiResponse<LinkSubEventResponse>>(
        `/v1/events/${parentEventId}/sub-events`,
        { event_id: subEventId }
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to link sub event');
    },
    onSuccess: (_data, { parentEventId, subEventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventSubEvents(parentEventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(subEventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetails(subEventId) });
    },
  });
}
