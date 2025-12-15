'use client';

import apiClient from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export interface FollowingEventsParams {
  enabled?: boolean;
}

/**
 * Custom hook to fetch events from users the current user follows
 * Events are returned in ascending order by start date (soonest first)
 */
export function useFollowingEvents(params: FollowingEventsParams = {}) {
  const { enabled = true } = params;

  return useQuery<EventWithUser[], Error>({
    queryKey: ['following-events'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/events/following');

      // Handle response format: { data: [...events], message: "..." }
      if (response && response.data) {
        return response.data;
      }

      return [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3; // Retry up to 3 times for other errors
    },
  });
}
