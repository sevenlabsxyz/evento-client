import { apiClient } from '@/lib/api/client';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface GalleryLikesResponse {
  likes: number;
  has_liked: boolean;
}

interface LikeActionResponse {
  action: 'liked' | 'unliked';
  has_liked: boolean;
}

export function useGalleryItemLikes(itemId?: string, eventId?: string) {
  const queryClient = useQueryClient();

  // Query to get likes for a gallery item
  const likesQuery = useQuery({
    queryKey: ['gallery', 'likes', itemId],
    queryFn: async (): Promise<GalleryLikesResponse> => {
      if (!itemId || !eventId) return { likes: 0, has_liked: false };

      const response = await apiClient.get<GalleryLikesResponse>(
        `/v1/events/${eventId}/gallery/likes?itemId=${itemId}`
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data;
      }

      // Fallback
      return { likes: 0, has_liked: false };
    },
    enabled: !!itemId && !!eventId,
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // Mutation to toggle like status
  const likeMutation = useMutation({
    mutationFn: async (): Promise<LikeActionResponse> => {
      if (!itemId || !eventId) throw new Error('No gallery item ID or event ID provided');

      const response = await apiClient.post<LikeActionResponse>(
        `/v1/events/${eventId}/gallery/likes`,
        {
          itemId,
        }
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data;
      }

      throw new Error('Failed to toggle like');
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: ['gallery', 'likes', itemId],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<GalleryLikesResponse>([
        'gallery',
        'likes',
        itemId,
      ]);

      // Optimistically update to the new value
      if (previousData) {
        const newData = {
          ...previousData,
          likes: previousData.has_liked ? previousData.likes - 1 : previousData.likes + 1,
          has_liked: !previousData.has_liked,
        };

        queryClient.setQueryData(['gallery', 'likes', itemId], newData);
      }

      return { previousData };
    },
    onError: (err, _, context) => {
      // Revert to the previous value if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(['gallery', 'likes', itemId], context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to make sure our local data is correct
      queryClient.invalidateQueries({ queryKey: ['gallery', 'likes', itemId] });
    },
  });

  // Function to toggle like status
  const toggleLike = () => {
    if (!itemId) {
      toast.error('Unable to like this image');
      return;
    }
    likeMutation.mutate(undefined, {
      onError: () => {
        toast.error('Failed to update like. Please try again.');
      },
    });
  };

  return {
    likes: likesQuery.data?.likes || 0,
    hasLiked: likesQuery.data?.has_liked || false,
    toggleLike,
    isLoading: likesQuery.isLoading || likeMutation.isPending,
  };
}
