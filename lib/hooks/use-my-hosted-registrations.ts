import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type {
  ApiResponse,
  HostedEventRegistration,
  MyHostedRegistrationsResponse,
  RegistrationStatus,
} from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useMyHostedRegistrations(
  status: RegistrationStatus | 'all' = 'pending',
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.myHostedRegistrations(), status],
    queryFn: async (): Promise<HostedEventRegistration[]> => {
      const response = await apiClient.get<ApiResponse<MyHostedRegistrationsResponse>>(
        `/v1/user/events/registrations?status=${status}`
      );

      const payload = response.data;

      if (Array.isArray(payload)) {
        return payload;
      }

      return payload?.data ?? [];
    },
    enabled,
    staleTime: 1 * 60 * 1000,
  });
}
