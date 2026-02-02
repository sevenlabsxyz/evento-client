import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, RegistrationStatus } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DenyRegistrationParams {
  eventId: string;
  registrationId: string;
  reason?: string;
}

interface DenyRegistrationResponse {
  registration: {
    id: string;
    approval_status: RegistrationStatus;
    reviewed_at: string;
    reviewed_by: string;
    denial_reason: string | null;
  };
}

export function useDenyRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      registrationId,
      reason,
    }: DenyRegistrationParams): Promise<DenyRegistrationResponse> => {
      const response = await apiClient.post<ApiResponse<DenyRegistrationResponse>>(
        `/v1/events/${eventId}/registration/submissions/${registrationId}/deny`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationSubmissions(variables.eventId),
      });
    },
  });
}
