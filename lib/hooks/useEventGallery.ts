import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse, UserDetails } from '@/lib/types/api';

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
      const response = await apiClient.get<ApiResponse<GalleryItem[]>>(
        `/v1/events/gallery?id=${eventId}`
      );
      
      if (!response || typeof response === 'string') {
        throw new Error('Invalid response format');
      }
      
      return (response as any)?.data || [];
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}