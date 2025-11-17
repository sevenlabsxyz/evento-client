'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { AddEventToListForm, ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddEventToListResponse {
  id: string;
  list_id: string;
  event_id: string;
  added_at: string;
  added_by: string;
  list_name: string;
  event_title: string;
}

export function useAddEventToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, eventId }: { listId: string; eventId: string }) => {
      const data: AddEventToListForm = { event_id: eventId };
      const response = await apiClient.post<ApiResponse<AddEventToListResponse>>(
        `/v1/user/lists/${listId}/events`,
        data
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to add event to list');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listEvents(data.list_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventSavedStatus(data.event_id) });
    },
  });
}
