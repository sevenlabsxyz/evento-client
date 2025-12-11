import { apiClient } from '@/lib/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ galleryItemId, eventId }: { galleryItemId: string; eventId: string }) => {
      const response = await apiClient.delete<null>(`/v1/events/gallery?id=${galleryItemId}`);

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && !(response as { success: boolean }).success) {
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
