'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { EventWithUser } from '@/lib/types/api';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

interface MyDraftEventsParams {
  search?: string;
  type?: 'rsvp' | 'registration' | 'ticketed';
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface MyDraftEventsResponse {
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

export function useMyDraftEvents(params: MyDraftEventsParams = {}) {
  const { search = '', type, limit = 10, enabled = true } = params;

  return useInfiniteQuery<MyDraftEventsResponse, Error, InfiniteData<MyDraftEventsResponse>>({
    queryKey: [...queryKeys.eventsUserMeDrafts(), search, type ?? 'all', limit],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) || 1;
      const queryParams = new URLSearchParams();

      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (search) {
        queryParams.append('search', search);
      }

      if (type) {
        queryParams.append('type', type);
      }

      const response = await apiClient.get(`/v1/events/me/drafts?${queryParams.toString()}`);

      if (response && response.data) {
        return {
          events: response.data.events || [],
          pagination: response.data.pagination,
        };
      }

      throw new Error('Failed to fetch draft events');
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }

      return undefined;
    },
    initialPageParam: 1,
  });
}
