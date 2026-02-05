import { apiClient } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ galleryItemId, eventId }: { galleryItemId: string; eventId: string }) => {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/v1/events/${eventId}/gallery?galleryItemId=${galleryItemId}`
      );

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      if ('success' in response && !response.success) {
        throw new Error('Failed to delete photo');
      }

      return { galleryItemId, eventId };
    },
    onSuccess: ({ eventId }) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ['event', 'gallery', eventId],
      });
    },
  });
}
