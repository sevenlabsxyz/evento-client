import { apiClient } from '@/lib/api/client';
import { EventInvite } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

interface EventInvitesResponse {
  success: boolean;
  message: string;
  data: EventInvite[];
}

// Hook to fetch event invites
export function useEventInvites(status?: 'pending' | 'responded') {
  return useQuery({
    queryKey: ['event-invites', status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const response = await apiClient.get<EventInvitesResponse>(`/v1/events/invites${params}`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
