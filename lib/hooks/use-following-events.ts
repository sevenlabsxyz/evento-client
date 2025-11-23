'use client';

import apiClient from '@/lib/api/client';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export interface FollowingEventsParams {
  limit?: number;
  enabled?: boolean;
}

export interface FollowingEventsResponse {
  events: EventWithUser[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Custom hook to fetch events from users the current user follows
 * Events are returned in ascending order by start date (soonest first)
 * Uses infinite query to support "load more" functionality
 */
export function useFollowingEvents(params: FollowingEventsParams = {}) {
  const { limit = 10, enabled = true } = params;

  return useInfiniteQuery<FollowingEventsResponse, Error, InfiniteData<FollowingEventsResponse>>({
    queryKey: ['following-events', limit],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // TODO: Update this endpoint when backend is ready
      // Expected endpoint: /v1/events/following
      // Expected response: { events: EventWithUser[], pagination: {...} }
      // Events should be sorted by start date ascending (soonest first)
      const response = await apiClient.get(`/v1/events/following?${queryParams.toString()}`);

      // Transform and return the response data
      if (response && response.data) {
        return {
          events: response.data.events || [],
          pagination: response.data.pagination,
        };
      }

      throw new Error('Failed to fetch following events');
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3; // Retry up to 3 times for other errors
    },
    initialPageParam: 1,
  });
}
