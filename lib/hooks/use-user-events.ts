'use client';

import apiClient from '@/lib/api/client';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { EventWithUser } from '../types/api';

export type EventFilterType = 'upcoming' | 'hosting' | 'attending';
export type EventTimeframe = 'all' | 'future' | 'past';
export type EventSortBy = 'date-asc' | 'date-desc' | 'created-asc' | 'created-desc';

export interface UserEventsParams {
  username?: string;
  search?: string;
  filter?: EventFilterType;
  timeframe?: EventTimeframe;
  sortBy?: EventSortBy;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UserEventsResponse {
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
 * Custom hook to fetch user events with filtering, sorting, and pagination
 * Uses infinite query to support "load more" functionality
 */
export function useUserEvents(params: UserEventsParams) {
  const {
    username,
    search = '',
    filter = 'upcoming',
    timeframe = 'all',
    sortBy = 'date-desc',
    limit = 10,
    enabled = true,
  } = params;

  return useInfiniteQuery<UserEventsResponse, Error, InfiniteData<UserEventsResponse>>({
    queryKey: ['user-events', username, search, filter, timeframe, sortBy, limit],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      // Only fetch if we have a username
      if (!username) {
        return {
          events: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('username', username);

      if (filter !== 'upcoming') {
        queryParams.append('filter', filter);
      }

      if (search) {
        queryParams.append('search', search);
      }

      if (sortBy) {
        const [field, order] = sortBy.split('-');
        queryParams.append('sortBy', field);
        queryParams.append('sortOrder', order);
      }

      if (timeframe) {
        queryParams.append('timeframe', timeframe);
      }

      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // Make the API call
      const response = await apiClient.get(`/v1/events/user-events?${queryParams.toString()}`);

      // Transform and return the response data
      if (response && response.data) {
        return {
          events: response.data.events || [],
          pagination: response.data.pagination,
        };
      }

      throw new Error('Failed to fetch user events');
    },
    enabled: !!username && enabled,
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
