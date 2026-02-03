import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, RegistrationSubmissionDetail } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useRegistrationSubmissionDetail(eventId: string, registrationId: string | null) {
  return useQuery({
    queryKey: queryKeys.registrationSubmissionDetail(eventId, registrationId!),
    queryFn: async (): Promise<RegistrationSubmissionDetail> => {
      const response = await apiClient.get<ApiResponse<RegistrationSubmissionDetail>>(
        `/v1/events/${eventId}/registration/submissions/${registrationId}`
      );
      return response.data;
    },
    enabled: !!eventId && !!registrationId,
    staleTime: 1 * 60 * 1000,
  });
}
