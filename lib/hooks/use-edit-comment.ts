import { apiClient } from '@/lib/api/client';
import { EventComment } from '@/lib/hooks/use-event-comments';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EditCommentParams {
  commentId: string;
  message: string;
  eventId: string;
}

export function useEditComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      message,
      eventId,
    }: EditCommentParams): Promise<EventComment> => {
      const response = await apiClient.patch<EventComment>(`/v1/events/${eventId}/comments`, {
        commentId,
        message,
      });

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data;
      }

      // If the API returns the comment directly without wrapping it
      return response as unknown as EventComment;
    },
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch comments
      queryClient.invalidateQueries({
        queryKey: ['event', 'comments', variables.eventId],
      });
    },
    onError: (error) => {
      logger.error('Error editing comment', {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}
