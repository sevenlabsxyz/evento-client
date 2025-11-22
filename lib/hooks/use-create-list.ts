'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, CreateListForm, UserList } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to create a new list
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateListForm) => {
      const response = await apiClient.post<ApiResponse<UserList>>('/v1/user/lists', data);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to create list');
    },
    onSuccess: () => {
      // Invalidate user lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}
