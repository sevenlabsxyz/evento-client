'use client';

import apiClient from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export interface PublicUserEventsParams {
  username: string;
  enabled?: boolean;
}

/**
 * Custom hook to fetch public events for a specific user by username
 * Used when viewing another user's profile
 */
export function usePublicUserEvents(params: PublicUserEventsParams) {
  const { username, enabled = true } = params;

  return useQuery<EventWithUser[], Error>({
    queryKey: ['public-user-events', username],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/users/by-username/${username}/events`);

      // Handle response format: { data: [...events], message: "..." }
      if (response && response.data) {
        return response.data;
      }

      return [];
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) or 404 (user not found)
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
