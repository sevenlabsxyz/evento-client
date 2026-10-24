'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, ListEvent, SavedEventStatus } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RemoveEventResponse {
  removed_event_id: string;
  from_list_id: string;
}

export interface RemoveEventFromListVariables {
  listId: string;
  eventId: string;
}

interface RemoveEventFromListContext {
  previousStatus: SavedEventStatus | undefined;
  previousListEvents: ListEvent[] | undefined;
}

export function useRemoveEventFromList() {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveEventResponse,
    Error,
    RemoveEventFromListVariables,
    RemoveEventFromListContext
  >({
    mutationFn: async ({ listId, eventId }) => {
      const response = await apiClient.delete<ApiResponse<RemoveEventResponse>>(
        `/v1/user/lists/${listId}/events/${eventId}`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to remove event from list');
    },
    onMutate: async ({ listId, eventId }) => {
      const statusKey = queryKeys.eventSavedStatus(eventId);
      const listEventsKey = queryKeys.listEvents(listId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: statusKey }),
        queryClient.cancelQueries({ queryKey: listEventsKey }),
      ]);

      const previousStatus = queryClient.getQueryData<SavedEventStatus>(statusKey);
      const previousListEvents = queryClient.getQueryData<ListEvent[]>(listEventsKey);

      if (previousStatus) {
        const savedInLists = previousStatus.saved_in_lists.filter(
          (entry) => entry.list_id !== listId
        );
        queryClient.setQueryData<SavedEventStatus>(statusKey, {
          ...previousStatus,
          is_saved: savedInLists.length > 0,
          saved_in_lists: savedInLists,
        });
      }

      if (previousListEvents) {
        queryClient.setQueryData<ListEvent[]>(
          listEventsKey,
          previousListEvents.filter((entry) => entry.event_id !== eventId)
        );
      }

      return { previousStatus, previousListEvents };
    },
    onError: (_error, { listId, eventId }, context) => {
      if (!context) return;
      queryClient.setQueryData(queryKeys.eventSavedStatus(eventId), context.previousStatus);
      queryClient.setQueryData(queryKeys.listEvents(listId), context.previousListEvents);
    },
    onSettled: (_data, _error, { listId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.listEvents(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventSavedStatus(eventId) });
    },
  });
}
