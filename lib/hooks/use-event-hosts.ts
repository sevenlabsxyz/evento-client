import { apiClient } from '@/lib/api/client';
import { ApiResponse, UserDetails } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export interface EventHost {
  event_id: string;
  created_at: string;
  user_details: UserDetails;
}

export function useEventHosts(eventId: string) {
  return useQuery({
    queryKey: ['event', 'hosts', eventId],
    queryFn: async (): Promise<EventHost[]> => {
      const response = await apiClient.get<ApiResponse<EventHost[]>>(`/v1/events/${eventId}/hosts`);

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data || [];
      }

      // Fallback for direct data response
      return response as EventHost[];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
