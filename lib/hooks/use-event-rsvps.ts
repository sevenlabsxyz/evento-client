'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, EventRSVP } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useEventRSVPs(eventId: string) {
  return useQuery({
    queryKey: ['eventRSVPs', eventId],
    queryFn: async (): Promise<EventRSVP[]> => {
      const response = await apiClient.get<ApiResponse<EventRSVP[]>>(`/v1/events/${eventId}/rsvps`);
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}
