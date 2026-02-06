import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteCommentParams {
  commentId: string;
  eventId: string;
}

interface DeleteCommentResponse {
  id: string;
}

const isApiResponse = <T,>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      eventId,
    }: DeleteCommentParams): Promise<DeleteCommentResponse> => {
      const response = await apiClient.delete<
        ApiResponse<DeleteCommentResponse> | DeleteCommentResponse
      >(
        `/v1/events/${eventId}/comments/${commentId}`
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if (isApiResponse<DeleteCommentResponse>(response)) {
        // We do this here to ensure the UI is updated before we return
        // Invalidate the comments query to refetch comments
        await queryClient.invalidateQueries({
          queryKey: ['event', 'comments', eventId],
        });
        return response.data || { id: commentId };
      }

      // Fallback
      // We do this here to ensure the UI is updated before we return
      // Invalidate the comments query to refetch comments
      await queryClient.invalidateQueries({
        queryKey: ['event', 'comments', eventId],
      });
      return 'id' in response ? response : { id: commentId };
    },
    onSuccess: (_, variables) => {
      // This is not needed as we are invalidating the query in mutationFn
    },
  });
}
