'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, UpdateListForm, UserList } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to update a list
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, data }: { listId: string; data: UpdateListForm }) => {
      const response = await apiClient.patch<ApiResponse<UserList>>(
        `/v1/user/lists/${listId}`,
        data
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to update list');
    },
    onSuccess: (data) => {
      // Invalidate user lists and specific list
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.list(data.id) });
    },
  });
}
