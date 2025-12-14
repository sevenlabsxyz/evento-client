'use client';

import apiClient from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export interface ForYouEventsParams {
  enabled?: boolean;
}

/**
 * Extended event type with featured fields from the For You API
 */
export interface ForYouEvent extends EventWithUser {
  featured_id: string;
  featured_position: number;
}

/**
 * Custom hook to fetch "For You" featured events
 * Events are curated and pre-sorted by featured_position on the backend
 */
export function useForYouEvents(params: ForYouEventsParams = {}) {
  const { enabled = true } = params;

  return useQuery<ForYouEvent[], Error>({
    queryKey: ['for-you-events'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/events/for-you');

      // Handle both response formats: { data: [...] } or direct array
      if (response && response.data) {
        return response.data;
      }

      if (Array.isArray(response)) {
        return response;
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
