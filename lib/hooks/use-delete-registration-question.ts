import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteRegistrationQuestionParams {
  eventId: string;
  questionId: string;
}

interface DeleteRegistrationQuestionResponse {
  deleted: boolean;
}

export function useDeleteRegistrationQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      questionId,
    }: DeleteRegistrationQuestionParams): Promise<DeleteRegistrationQuestionResponse> => {
      const response = await apiClient.delete<ApiResponse<DeleteRegistrationQuestionResponse>>(
        `/v1/events/${eventId}/registration/questions/${questionId}`
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
