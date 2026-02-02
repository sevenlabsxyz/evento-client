import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, RegistrationStatus } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ApproveRegistrationParams {
  eventId: string;
  registrationId: string;
}

interface ApproveRegistrationResponse {
  registration: {
    id: string;
    approval_status: RegistrationStatus;
    reviewed_at: string;
    reviewed_by: string;
  };
  rsvp: {
    id: string;
    status: string;
  } | null;
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      registrationId,
    }: ApproveRegistrationParams): Promise<ApproveRegistrationResponse> => {
      const response = await apiClient.post<ApiResponse<ApproveRegistrationResponse>>(
        `/v1/events/${eventId}/registration/submissions/${registrationId}/approve`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationSubmissions(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.eventRsvps(variables.eventId),
      });
    },
  });
}
