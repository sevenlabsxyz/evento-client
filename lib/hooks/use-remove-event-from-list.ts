'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RemoveEventResponse {
  removed_event_id: string;
  from_list_id: string;
}

export function useRemoveEventFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, eventId }: { listId: string; eventId: string }) => {
      const response = await apiClient.delete<ApiResponse<RemoveEventResponse>>(
        `/v1/user/lists/${listId}/events/${eventId}`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to remove event from list');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listEvents(data.from_list_id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventSavedStatus(data.removed_event_id),
      });
    },
  });
}
