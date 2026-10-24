'use client';

import apiClient from '@/lib/api/client';
import { invalidateAllEventSavedStatuses } from '@/lib/hooks/use-event-saved-status';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, UserList } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface DeleteListResponse {
  deleted_list_id: string;
}

/**
 * Hook to delete a list
 */
export function useDeleteList() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (listId: string) => {
      const response = await apiClient.delete<ApiResponse<DeleteListResponse>>(
        `/v1/user/lists/${listId}`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('lists.deleteFailed'));
    },
    onSuccess: ({ deleted_list_id }) => {
      queryClient.setQueryData<UserList[]>(queryKeys.userLists(), (lists) =>
        lists?.filter((list) => list.id !== deleted_list_id)
      );
      // Drop the list's cached events so nothing refetches a list that no longer exists.
      queryClient.removeQueries({ queryKey: queryKeys.list(deleted_list_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      invalidateAllEventSavedStatuses(queryClient);
    },
  });
}
