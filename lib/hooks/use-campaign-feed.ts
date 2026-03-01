import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export interface CampaignFeedItem {
  payer_username: string | null;
  payer_avatar: string | null;
  amount_sats: number;
  settled_at: string | null;
}

export function useEventCampaignFeed(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', 'event', eventId, 'feed'],
    queryFn: async (): Promise<CampaignFeedItem[]> => {
      const response = await apiClient.get<ApiResponse<CampaignFeedItem[]>>(
        `/v1/events/${eventId}/campaign/feed`
      );
      return response.data;
    },
    enabled: !!eventId && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}
