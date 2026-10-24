import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async ({ galleryItemId, eventId }: { galleryItemId: string; eventId: string }) => {
      const response = await apiClient.delete<
        ApiResponse<{ success?: boolean; message?: string } | null> | { id: string }
      >(`/v1/events/${eventId}/gallery?galleryItemId=${galleryItemId}`);

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if (isApiResponse<{ success?: boolean } | null>(response)) {
        if (response.success === false) {
          throw new Error(t('gallery.deleteFailed'));
        }

        const nested = response.data;
        if (
          nested &&
          typeof nested === 'object' &&
          'success' in nested &&
          nested.success === false
        ) {
          throw new Error(t('gallery.deleteFailed'));
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
