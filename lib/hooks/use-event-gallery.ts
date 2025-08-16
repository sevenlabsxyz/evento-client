import { apiClient } from '@/lib/api/client';
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

export function useEventGallery(eventId: string) {
  return useQuery({
    queryKey: ['event', 'gallery', eventId],
    queryFn: async (): Promise<GalleryItem[]> => {
      const response = await apiClient.get<GalleryItem[]>(`/v1/events/gallery?id=${eventId}`);

      // Handle the response structure { success, message, data }
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      // Check if it's the expected API response structure
      if ('success' in response && 'data' in response) {
        return response.data || [];
      }

      // Fallback for direct data response
      return response as unknown as GalleryItem[];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
