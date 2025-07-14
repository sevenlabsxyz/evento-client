import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse, UserDetails } from '@/lib/types/api';

export interface EventHost {
  event_id: string;
  created_at: string;
  user_details: UserDetails;
}

export function useEventHosts(eventId: string) {
  return useQuery({
    queryKey: ['event', 'hosts', eventId],
    queryFn: async (): Promise<EventHost[]> => {
      const response = await apiClient.get<ApiResponse<EventHost[]>>(
        `/v1/events/hosts?id=${eventId}`
      );
      
      if (!response || typeof response === 'string') {
        throw new Error('Invalid response format');
      }
      
      return (response as any)?.data || [];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}