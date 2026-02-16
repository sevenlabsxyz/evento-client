import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RemoveGuestParams {
  eventId: string;
  userId: string;
}

interface RemoveGuestResponse {
  removed_user_id: string;
}

export function useRemoveGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: RemoveGuestParams): Promise<RemoveGuestResponse> => {
      const response = await apiClient.delete<ApiResponse<RemoveGuestResponse>>(
        `/v1/events/${eventId}/rsvps/${userId}`
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.eventRsvps(variables.eventId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrationSubmissions(variables.eventId),
        }),
      ]);
    },
  });
}
