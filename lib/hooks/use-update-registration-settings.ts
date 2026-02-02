import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, ApprovalMode } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateRegistrationSettingsParams {
  eventId: string;
  registration_required?: boolean;
  approval_mode?: ApprovalMode;
}

interface UpdateRegistrationSettingsResponse {
  registration_required: boolean;
  approval_mode: ApprovalMode;
}

export function useUpdateRegistrationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      ...data
    }: UpdateRegistrationSettingsParams): Promise<UpdateRegistrationSettingsResponse> => {
      const response = await apiClient.patch<ApiResponse<UpdateRegistrationSettingsResponse>>(
        `/v1/events/${eventId}/registration`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationSettings(variables.eventId),
      });
    },
  });
}
