'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, SavedEventStatus } from '@/lib/types/api';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

export function useEventSavedStatus(eventId: string, enabled: boolean = true) {
  const t = useTranslations('hooks');
  return useQuery<SavedEventStatus, Error>({
    queryKey: queryKeys.eventSavedStatus(eventId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SavedEventStatus>>(
        `/v1/events/${eventId}/saved`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('lists.fetchSavedStatusFailed'));
    },
    enabled: enabled && !!eventId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Saved-status entries embed list names and membership, so renaming or deleting a
 * list makes every cached entry stale. Keys look like `['events', eventId, 'saved']`.
 */
export function invalidateAllEventSavedStatuses(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const [scope, , kind] = query.queryKey;
      return scope === queryKeys.events[0] && kind === 'saved';
    },
  });
}
