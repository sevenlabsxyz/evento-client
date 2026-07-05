'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UnlinkSubEventParams {
  parentEventId: string;
  subEventId: string;
}

/**
 * Removes the parent link from a sub-event. The sub-event itself is not
 * deleted — it becomes a standalone event again.
 */
export function useUnlinkSubEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentEventId, subEventId }: UnlinkSubEventParams) => {
      const response = await apiClient.delete<ApiResponse<unknown>>(
        `/v1/events/${parentEventId}/sub-events/${subEventId}`
      );

      if (response && response.success) {
        return response.data;
      }

      throw new Error('Failed to remove sub event');
    },
    onSuccess: (_data, { parentEventId, subEventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventSubEvents(parentEventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(subEventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetails(subEventId) });
    },
  });
}
