'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, SavedEventStatus } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useEventSavedStatus(eventId: string, enabled: boolean = true) {
  return useQuery<SavedEventStatus, Error>({
    queryKey: queryKeys.eventSavedStatus(eventId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SavedEventStatus>>(
        `/v1/events/id/${eventId}/saved`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch saved status');
    },
    enabled: enabled && !!eventId,
    staleTime: 1 * 60 * 1000,
  });
}
