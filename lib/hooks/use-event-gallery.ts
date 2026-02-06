import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { UserDetails } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export interface GalleryItem {
  id: string;
  created_at: string;
  url: string;
  user_details: UserDetails;
  events: {
    id: string;
    title: string;
  };
}

const isApiResponse = <T,>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export function useEventGallery(eventId: string) {
  return useQuery({
    queryKey: ['event', 'gallery', eventId],
    queryFn: async (): Promise<GalleryItem[]> => {
      const response = await apiClient.get<ApiResponse<GalleryItem[]> | GalleryItem[]>(
        `/v1/events/${eventId}/gallery`
      );

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if (isApiResponse<GalleryItem[]>(response)) {
        return response.data || [];
      }

      // Fallback for direct data response
      return response;
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
