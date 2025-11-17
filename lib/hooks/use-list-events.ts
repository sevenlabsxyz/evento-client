'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, ListEvent } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch events in a specific list
 */
export function useListEvents(listId: string, enabled: boolean = true) {
  return useQuery<ListEvent[], Error>({
    queryKey: queryKeys.listEvents(listId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ListEvent[]>>(
        `/v1/user/lists/${listId}/events`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch list events');
    },
    enabled: enabled && !!listId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
}
