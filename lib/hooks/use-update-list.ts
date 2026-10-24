'use client';

import apiClient from '@/lib/api/client';
import { invalidateAllEventSavedStatuses } from '@/lib/hooks/use-event-saved-status';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, UpdateListForm, UserList } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

/**
 * Hook to update a list
 */
export function useUpdateList() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async ({ listId, data }: { listId: string; data: UpdateListForm }) => {
      const response = await apiClient.patch<ApiResponse<UserList>>(
        `/v1/user/lists/${listId}`,
        data
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('lists.updateFailed'));
    },
    onSuccess: (updatedList) => {
      // PATCH returns the row without `event_count`; keep the cached count.
      queryClient.setQueryData<UserList[]>(queryKeys.userLists(), (lists) =>
        lists?.map((list) => (list.id === updatedList.id ? { ...list, ...updatedList } : list))
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      // Saved-status entries embed list names.
      invalidateAllEventSavedStatuses(queryClient);
    },
  });
}
