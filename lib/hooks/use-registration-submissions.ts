import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type {
  ApiResponse,
  RegistrationStatus,
  RegistrationSubmissionsResponse,
} from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

interface UseRegistrationSubmissionsOptions {
  status?: RegistrationStatus | 'all';
  limit?: number;
  offset?: number;
}

export function useRegistrationSubmissions(
  eventId: string,
  options: UseRegistrationSubmissionsOptions = {}
) {
  const { status = 'all', limit = 50, offset = 0 } = options;

  return useQuery({
    queryKey: [...queryKeys.registrationSubmissions(eventId), { status, limit, offset }],
    queryFn: async (): Promise<RegistrationSubmissionsResponse> => {
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await apiClient.get<ApiResponse<RegistrationSubmissionsResponse>>(
        `/v1/events/${eventId}/registration/submissions?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!eventId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
