import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type {
  ApiResponse,
  RegistrationQuestion,
  UpdateRegistrationQuestionRequest,
} from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateRegistrationQuestionParams extends UpdateRegistrationQuestionRequest {
  eventId: string;
  questionId: string;
}

export function useUpdateRegistrationQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      questionId,
      ...data
    }: UpdateRegistrationQuestionParams): Promise<RegistrationQuestion> => {
      const response = await apiClient.patch<ApiResponse<RegistrationQuestion>>(
        `/v1/events/${eventId}/registration/questions/${questionId}`,
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
