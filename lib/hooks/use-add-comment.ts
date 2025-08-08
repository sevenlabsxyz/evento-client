import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/use-auth';
import { EventComment } from '@/lib/hooks/use-event-comments';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddCommentParams {
  event_id: string;
  message: string;
  parent_comment_id?: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: ['event', 'comments', newComment.event_id],
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        newComment.event_id,
      ]);

      // Generate random ID using timestamp and random string to ensure uniqueness
      // This helps avoid collisions when multiple optimistic comments are created
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const optimisticId = `optimistic-${timestamp}-${randomString}`;

      // Create an optimistic comment
      if (user) {
        const optimisticComment: EventComment = {
          id: optimisticId,
          created_at: new Date().toISOString(),
          message: newComment.message,
          user_id: user.id,
          event_id: newComment.event_id,
          parent_comment_id: newComment.parent_comment_id || null,
          user_details: {
            username: user.username || '',
            image: user.image,
            verification_status: user.verification_status,
          },
          replies: [],
          optimistic: true, // Flag to mark this as an optimistic update
        };

        // Add the optimistic comment to the query data
        if (optimisticComment.parent_comment_id) {
          queryClient.setQueryData<EventComment[]>(
            ['event', 'comments', newComment.event_id],
            (old) => {
              if (!old) return [];

              // Always create a deep copy to avoid state mutation issues
              const commentsCopy = JSON.parse(JSON.stringify(old || []));

              // Recursive function to find a comment by ID at any nesting level
              const findAndAddReply = (comments: EventComment[]): boolean => {
                for (let i = 0; i < comments.length; i++) {
                  // Check if this is the parent comment
                  if (comments[i].id === optimisticComment.parent_comment_id) {
                    // Ensure replies array exists
                    if (!comments[i].replies) {
                      comments[i].replies = [];
                    }
                    // Add optimistic reply at the beginning
                    comments[i].replies.unshift(optimisticComment);
                    return true; // Found and updated
                  }

                  // If this comment has replies, search within them recursively
                  if (comments[i].replies && comments[i].replies.length > 0) {
                    if (findAndAddReply(comments[i].replies)) {
                      return true; // Reply was added to a nested comment
                    }
                  }
                }
                return false; // Not found in this branch
              };

              // Start the recursive search from the top level
              if (findAndAddReply(commentsCopy)) {
                return commentsCopy;
              } else {
                return old;
              }
            }
          );
        } else {
          // Add as a top-level comment
          queryClient.setQueryData<EventComment[]>(
            ['event', 'comments', newComment.event_id],
            (old) => {
              return old ? [optimisticComment, ...old] : [optimisticComment];
            }
          );
        }
      }

      // Return a context object with the snapshot
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      // If the mutation fails, revert to the previous state
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['event', 'comments', newComment.event_id],
          context.previousComments
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch comments
      // This replaces our optimistic comment with the real one from the server
      queryClient.invalidateQueries({
        queryKey: ['event', 'comments', variables.event_id],
      });
    },
  });
}
