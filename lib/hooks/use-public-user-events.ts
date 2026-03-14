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
  const usernameOrDefault = username.trim().toLowerCase();

  return useQuery<EventWithUser[], Error>({
    queryKey: ['public-user-events', usernameOrDefault],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/users/by-username/${usernameOrDefault}/events`);

      if (!response?.data) {
        return [];
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (Array.isArray(response.data.events)) {
        return response.data.events;
      }

      if (Array.isArray(response.data.data?.events)) {
        return response.data.data.events;
      }

      return [];
    },
    enabled: enabled && !!usernameOrDefault,
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
