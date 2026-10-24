'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, ListEvent } from '@/lib/types/api';
import { queryOptions, useQueries, useQuery } from '@tanstack/react-query';

const LIST_EVENTS_STALE_TIME = 2 * 60 * 1000;

/**
 * Shared query definition for a list's events so single-list and multi-list
 * consumers read and write the same cache entry.
 */
export function listEventsQueryOptions(listId: string) {
  return queryOptions<ListEvent[], Error>({
    queryKey: queryKeys.listEvents(listId),
    queryFn: async () => {
      // A deleted or foreign list returns 404; the UI renders a not-found state for it.
      const response = await apiClient.get<ApiResponse<ListEvent[]>>(
        `/v1/user/lists/${listId}/events`,
        { suppressErrorStatuses: [404] }
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch list events');
    },
    staleTime: LIST_EVENTS_STALE_TIME,
  });
}

/**
 * Hook to fetch events in a specific list
 */
export function useListEvents(listId: string, enabled: boolean = true) {
  return useQuery({
    ...listEventsQueryOptions(listId),
    enabled: enabled && !!listId,
  });
}

export interface ListEventsSummary {
  events: ListEvent[] | undefined;
  isLoading: boolean;
}

/**
 * Fetches the events of several lists in parallel (cover mosaics, accurate counts).
 * Results are keyed by list id and share cache entries with `useListEvents`.
 */
export function useListsEvents(listIds: string[]): Record<string, ListEventsSummary> {
  return useQueries({
    queries: listIds.map((listId) => listEventsQueryOptions(listId)),
    combine: (results) => {
      const summaries: Record<string, ListEventsSummary> = {};
      results.forEach((result, index) => {
        summaries[listIds[index]] = { events: result.data, isLoading: result.isLoading };
      });
      return summaries;
    },
  });
}
