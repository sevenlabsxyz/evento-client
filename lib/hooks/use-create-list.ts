'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, CreateListForm, UserList } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const CREATE_LIST_MUTATION_KEY = ['lists', 'create'] as const;

/**
 * Hook to create a new list
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: CREATE_LIST_MUTATION_KEY,
    mutationFn: async (data: CreateListForm) => {
      const response = await apiClient.post<ApiResponse<UserList>>('/v1/user/lists', data);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to create list');
    },
    onSuccess: (newList) => {
      // Show the new list immediately (e.g. in the save sheet) while the refetch runs.
      queryClient.setQueryData<UserList[]>(queryKeys.userLists(), (lists) =>
        lists && !lists.some((list) => list.id === newList.id) ? [...lists, newList] : lists
      );
      queryClient.setQueryData(queryKeys.listEvents(newList.id), []);
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}
