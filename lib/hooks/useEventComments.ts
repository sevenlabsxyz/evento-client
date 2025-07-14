import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse, UserDetails } from '@/lib/types/api';

export interface EventComment {
  id: string;
  created_at: string;
  message: string;
  user_id: string;
  event_id: string;
  parent_comment_id: string | null;
  user_details: UserDetails;
  replies: EventComment[];
}

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: ['event', 'comments', eventId],
    queryFn: async (): Promise<EventComment[]> => {
      const response = await apiClient.get<ApiResponse<EventComment[]>>(
        `/v1/events/comments?event_id=${eventId}`
      );
      
      if (!response || typeof response === 'string') {
        throw new Error('Invalid response format');
      }
      
      return (response as any)?.data || [];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes (comments update more frequently)
  });
}