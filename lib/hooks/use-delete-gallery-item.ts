import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const isApiResponse = <T,>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ galleryItemId, eventId }: { galleryItemId: string; eventId: string }) => {
      const response = await apiClient.delete<
        ApiResponse<{ success?: boolean; message?: string } | null> | { id: string }
      >(
        `/v1/events/${eventId}/gallery?galleryItemId=${galleryItemId}`
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if (isApiResponse<{ success?: boolean } | null>(response)) {
        if (response.success === false) {
          throw new Error('Failed to delete photo');
        }

        const nested = response.data;
        if (nested && typeof nested === 'object' && 'success' in nested && nested.success === false) {
          throw new Error('Failed to delete photo');
        }
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
