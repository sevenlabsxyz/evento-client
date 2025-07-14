import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse, Event } from '@/lib/types/api';

export function useEventDetails(eventId: string) {
  return useQuery({
    queryKey: ['event', 'details', eventId],
    queryFn: async (): Promise<Event> => {
      const response = await apiClient.get<ApiResponse<Event>>(
        `/v1/events/details?id=${eventId}`
      );
      
      if (!response || typeof response === 'string') {
        throw new Error('Invalid response format');
      }
      
      return (response as any)?.data || null;
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}