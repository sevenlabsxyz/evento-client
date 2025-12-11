import { apiClient } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteCommentParams {
  commentId: string;
  eventId: string;
}

interface DeleteCommentResponse {
  id: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      eventId,
    }: DeleteCommentParams): Promise<DeleteCommentResponse> => {
      const response = await apiClient.delete<DeleteCommentResponse>(
        `/v1/events/comments?id=${commentId}`
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        // We do this here to ensure the UI is updated before we return
        // Invalidate the comments query to refetch comments
        await queryClient.invalidateQueries({
          queryKey: ['event', 'comments', eventId],
        });
        return (response.data as DeleteCommentResponse) || { id: commentId };
      }

      // Fallback
      // We do this here to ensure the UI is updated before we return
      // Invalidate the comments query to refetch comments
      await queryClient.invalidateQueries({
        queryKey: ['event', 'comments', eventId],
      });
      return { id: commentId };
    },
    onSuccess: (_, variables) => {
      // This is not needed as we are invalidating the query in mutationFn
    },
  });
}
