import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse, RegistrationQuestion } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useRegistrationQuestions(eventId: string) {
  return useQuery({
    queryKey: queryKeys.registrationQuestions(eventId),
    queryFn: async (): Promise<RegistrationQuestion[]> => {
      const response = await apiClient.get<ApiResponse<RegistrationQuestion[]>>(
        `/v1/events/${eventId}/registration/questions`
      );
      return response.data;
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
