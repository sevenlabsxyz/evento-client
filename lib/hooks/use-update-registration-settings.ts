import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, ApprovalMode } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateRegistrationSettingsParams {
  eventId: string;
  registration_required?: boolean;
  approval_mode?: ApprovalMode;
  hide_location_for_unapproved?: boolean;
  hide_guest_list_for_unapproved?: boolean;
  hide_description_for_unapproved?: boolean;
  custom_rsvp_email_enabled?: boolean;
  custom_rsvp_email_content?: string | null;
}

interface UpdateRegistrationSettingsResponse {
  registration_required: boolean;
  approval_mode: ApprovalMode;
  hide_location_for_unapproved: boolean;
  hide_guest_list_for_unapproved: boolean;
  hide_description_for_unapproved: boolean;
  custom_rsvp_email_enabled?: boolean;
  custom_rsvp_email_content?: string | null;
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
      queryClient.invalidateQueries({
        queryKey: ['event', 'details', variables.eventId],
      });
    },
  });
}
