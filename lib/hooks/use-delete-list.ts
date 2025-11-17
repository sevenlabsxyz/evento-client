'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteListResponse {
  deleted_list_id: string;
}

/**
 * Hook to delete a list
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const response = await apiClient.delete<ApiResponse<DeleteListResponse>>(
        `/v1/user/lists/${listId}`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to delete list');
    },
    onSuccess: () => {
      // Invalidate user lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}
