'use client';

import apiClient from '@/lib/api/client';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export interface DiscoverEventsParams {
  limit?: number;
  enabled?: boolean;
}

export interface DiscoverEventsResponse {
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
 * Custom hook to fetch curated/discover events
 * Events are curated in the database and returned in that order
 * Uses infinite query to support "load more" functionality
 */
export function useDiscoverEvents(params: DiscoverEventsParams = {}) {
  const { limit = 10, enabled = true } = params;

  return useInfiniteQuery<DiscoverEventsResponse, Error, InfiniteData<DiscoverEventsResponse>>({
    queryKey: ['discover-events', limit],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // TODO: Update this endpoint when backend is ready
      // Expected endpoint: /v1/events/discover
      // Expected response: { events: EventWithUser[], pagination: {...} }
      //
      // NOTE: If backend returns event IDs only, we'll need to:
      // 1. Fetch IDs from /v1/events/discover
      // 2. Fetch full event data using those IDs (e.g., POST /v1/events/batch)
      //
      // RECOMMENDED: Have backend return full event objects directly for simplicity
      const response = await apiClient.get(`/v1/events/discover?${queryParams.toString()}`);

      // Transform and return the response data
      if (response && response.data) {
        return {
          events: response.data.events || [],
          pagination: response.data.pagination,
        };
      }

      throw new Error('Failed to fetch discover events');
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
