import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, RegistrationSettings } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useRegistrationSettings(eventId: string) {
  return useQuery({
    queryKey: queryKeys.registrationSettings(eventId),
    queryFn: async (): Promise<RegistrationSettings> => {
      const response = await apiClient.get<ApiResponse<RegistrationSettings>>(
        `/v1/events/${eventId}/registration`
      );
      return response.data;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
