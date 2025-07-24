import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CommentReactions {
  reactions: {
    like: number;
    [key: string]: number; // Allow indexing with string keys
  };
  user_reaction: string | null;
}

export type ReactionType = 'like';

export function useCommentReactions(commentId: string) {
  // Query to get current reactions
  const query = useQuery({
    queryKey: ['comment', 'reactions', commentId],
    queryFn: async (): Promise<CommentReactions> => {
      const response = await apiClient.get<CommentReactions>(
        `/v1/events/comments/${commentId}/reactions`
      );

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data;
      }

      return response as unknown as CommentReactions;
    },
    enabled: !!commentId,
  });

  const queryClient = useQueryClient();

  // Mutation to toggle a reaction
  const mutation = useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
    }: {
      commentId: string;
      reactionType: ReactionType;
    }) => {
      const response = await apiClient.post<
        ApiResponse<{
          action: 'added' | 'removed' | 'updated';
          has_reacted: boolean;
          reaction_type?: ReactionType;
        }>
      >(`/v1/events/comments/${commentId}/reactions`, { reactionType });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      return response;
    },
    onMutate: async ({ commentId, reactionType }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comment', 'reactions', commentId],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<CommentReactions>([
        'comment',
        'reactions',
        commentId,
      ]);

      // Optimistically update to the new value
      if (previousData) {
        const currentReaction = previousData.user_reaction;
        const newData = { ...previousData };

        // If user already has this reaction, remove it
        if (currentReaction === reactionType) {
          newData.user_reaction = null;
          newData.reactions = {
            ...newData.reactions,
            [reactionType]: Math.max(0, (newData.reactions[reactionType] || 0) - 1),
          };
        }
        // If user has a different reaction, update it
        else if (currentReaction && currentReaction !== reactionType) {
          newData.user_reaction = reactionType;
          newData.reactions = {
            ...newData.reactions,
            [currentReaction]: Math.max(0, (newData.reactions[currentReaction] || 0) - 1),
            [reactionType]: (newData.reactions[reactionType] || 0) + 1,
          };
        }
        // If user has no reaction, add this one
        else {
          newData.user_reaction = reactionType;
          newData.reactions = {
            ...newData.reactions,
            [reactionType]: (newData.reactions[reactionType] || 0) + 1,
          };
        }

        queryClient.setQueryData(['comment', 'reactions', commentId], newData);
      }

      return { previousData };
    },
    onError: (err, { commentId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['comment', 'reactions', commentId], context.previousData);
      }
    },
    onSettled: (_, __, { commentId }) => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({
        queryKey: ['comment', 'reactions', commentId],
      });
    },
  });

  const toggleReaction = (reactionType: ReactionType) => {
    mutation.mutate({ commentId, reactionType });
  };

  return {
    reactions: query.data?.reactions || { like: 0 },
    userReaction: query.data?.user_reaction,
    isLoading: query.isLoading,
    toggleReaction,
    isToggling: mutation.isPending,
  };
}
