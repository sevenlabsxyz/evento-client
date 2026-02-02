import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type {
  ApiResponse,
  CreateRegistrationQuestionRequest,
  RegistrationQuestion,
} from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateRegistrationQuestionParams extends CreateRegistrationQuestionRequest {
  eventId: string;
}

export function useCreateRegistrationQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      ...data
    }: CreateRegistrationQuestionParams): Promise<RegistrationQuestion> => {
      const response = await apiClient.post<ApiResponse<RegistrationQuestion>>(
        `/v1/events/${eventId}/registration/questions`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationQuestions(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrationSettings(variables.eventId),
      });
    },
  });
}
