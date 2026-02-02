import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type {
  ApiResponse,
  SubmitRegistrationRequest,
  SubmitRegistrationResponse,
} from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SubmitRegistrationParams extends SubmitRegistrationRequest {
  eventId: string;
}

export function useSubmitRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      ...data
    }: SubmitRegistrationParams): Promise<SubmitRegistrationResponse> => {
      const response = await apiClient.post<ApiResponse<SubmitRegistrationResponse>>(
        `/v1/events/${eventId}/registration/submit`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate registration-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.myRegistration(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationSubmissions(variables.eventId),
      });

      // If auto-approved, also invalidate RSVP queries
      if (data.auto_approved) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userRsvp(variables.eventId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.eventRsvps(variables.eventId),
        });
      }
    },
  });
}
