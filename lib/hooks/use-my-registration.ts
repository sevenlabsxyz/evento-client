import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, MyRegistrationResponse } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function useMyRegistration(eventId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.myRegistration(eventId),
    queryFn: async (): Promise<MyRegistrationResponse> => {
      const response = await apiClient.get<ApiResponse<MyRegistrationResponse>>(
        `/v1/events/${eventId}/registration/my`
      );
      return response.data;
    },
    enabled: !!eventId && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
