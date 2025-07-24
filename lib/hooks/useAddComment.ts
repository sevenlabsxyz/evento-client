import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { EventComment } from '@/lib/hooks/useEventComments';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddCommentParams {
  event_id: string;
  message: string;
  parent_comment_id?: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddCommentParams): Promise<EventComment> => {
      const response = await apiClient.post<ApiResponse<EventComment[]>>(
        '/v1/events/comments',
        params
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure with data array
      if ('success' in response && 'data' in response && Array.isArray(response.data)) {
        return response.data[0] || null;
      }

      throw new Error('Invalid response structure');
    },
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch comments
      queryClient.invalidateQueries({ queryKey: ['event', 'comments', variables.event_id] });
    },
  });
}
