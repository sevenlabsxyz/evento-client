'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, CheckInResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CheckInArgs {
  eventId: string;
  token: string;
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<CheckInResponse, Error, CheckInArgs>({
    mutationFn: async ({ eventId, token }) => {
      const response = await apiClient.post<ApiResponse<CheckInResponse>>(
        `/v1/events/${eventId}/check-in`,
        { token }
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to check in');
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate attendees list to show the new check-in
      queryClient.invalidateQueries({
        queryKey: ['event', 'attendees', variables.eventId],
      });
      // Also invalidate sales to update ticket counts
      queryClient.invalidateQueries({
        queryKey: ['event', 'sales', variables.eventId],
      });
    },
  });
}
