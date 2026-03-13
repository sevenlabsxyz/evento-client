'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
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
    queryKey: queryKeys.followingEvents(),
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
      // Don't retry on 4xx errors
      const status = error?.status || error?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 1; // Retry once for faster failure
    },
  });
}
