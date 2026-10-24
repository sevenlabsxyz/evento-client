'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import {
  AddEventToListForm,
  ApiResponse,
  ListEvent,
  SavedEventStatus,
  UserList,
} from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface AddEventToListResponse {
  id: string;
  list_id: string;
  event_id: string;
  added_at: string;
  added_by: string;
  list_name: string;
  event_title: string;
}

export interface AddEventToListVariables {
  listId: string;
  eventId: string;
  /** Previously removed entry to put back optimistically (undo). */
  restore?: ListEvent;
}

interface AddEventToListContext {
  previousStatus: SavedEventStatus | undefined;
  previousListEvents: ListEvent[] | undefined;
}

export function useAddEventToList() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation<AddEventToListResponse, Error, AddEventToListVariables, AddEventToListContext>(
    {
      mutationFn: async ({ listId, eventId }) => {
        const data: AddEventToListForm = { event_id: eventId };
        const response = await apiClient.post<ApiResponse<AddEventToListResponse>>(
          `/v1/user/lists/${listId}/events`,
          data
        );

        if (response && response.data) {
          return response.data;
        }

        throw new Error(t('lists.addEventFailed'));
      },
      onMutate: async ({ listId, eventId, restore }) => {
        const statusKey = queryKeys.eventSavedStatus(eventId);
        const listEventsKey = queryKeys.listEvents(listId);
        await Promise.all([
          queryClient.cancelQueries({ queryKey: statusKey }),
          queryClient.cancelQueries({ queryKey: listEventsKey }),
        ]);

        const previousStatus = queryClient.getQueryData<SavedEventStatus>(statusKey);
        const previousListEvents = queryClient.getQueryData<ListEvent[]>(listEventsKey);
        const list = queryClient
          .getQueryData<UserList[]>(queryKeys.userLists())
          ?.find((candidate) => candidate.id === listId);

        if (previousStatus && list) {
          const alreadySaved = previousStatus.saved_in_lists.some(
            (entry) => entry.list_id === listId
          );
          if (!alreadySaved) {
            queryClient.setQueryData<SavedEventStatus>(statusKey, {
              ...previousStatus,
              is_saved: true,
              saved_in_lists: [
                ...previousStatus.saved_in_lists,
                { list_id: listId, list_name: list.name, is_default: list.is_default },
              ],
            });
          }
        }

        if (restore && previousListEvents) {
          const alreadyListed = previousListEvents.some((entry) => entry.event_id === eventId);
          if (!alreadyListed) {
            queryClient.setQueryData<ListEvent[]>(listEventsKey, [restore, ...previousListEvents]);
          }
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
    }
  );
}
