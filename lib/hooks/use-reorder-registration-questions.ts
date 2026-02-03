import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReorderRegistrationQuestionsParams {
  eventId: string;
  question_ids: string[];
}

interface ReorderRegistrationQuestionsResponse {
  reordered: number;
}

export function useReorderRegistrationQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      question_ids,
    }: ReorderRegistrationQuestionsParams): Promise<ReorderRegistrationQuestionsResponse> => {
      const response = await apiClient.post<ApiResponse<ReorderRegistrationQuestionsResponse>>(
        `/v1/events/${eventId}/registration/questions/reorder`,
        { question_ids }
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
