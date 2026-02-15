import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.post(`/v1/events/${eventId}/publish`);
      return response.data;
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMeDrafts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMe() });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', 'details', eventId] });
    },
  });
}
