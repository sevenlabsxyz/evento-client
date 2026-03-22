import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DuplicateEventResponse {
  id: string;
  title: string;
  status: 'draft' | 'published';
  type?: 'rsvp' | 'registration' | 'ticketed';
  visibility?: 'public' | 'private';
  creator_user_id?: string;
}

interface DuplicateEventApiResponse {
  success: boolean;
  message: string;
  data: DuplicateEventResponse;
}

export function useDuplicateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.post<DuplicateEventApiResponse>(
        `/v1/events/${eventId}/duplicate`
      );
      return response.data;
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMe() });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMeDrafts() });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
    },
  });
}
