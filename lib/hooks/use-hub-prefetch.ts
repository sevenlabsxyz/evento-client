'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { Env } from '@/lib/constants/env';

/**
 * Prefetches all hub page data in parallel on mount.
 * Uses queryClient.prefetchQuery so cached data is shown instantly
 * while stale data is revalidated in the background.
 */
export function useHubPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch for-you events (shown by default on Discover tab)
    queryClient.prefetchQuery({
      queryKey: queryKeys.forYouEvents(),
      queryFn: async () => {
        const response = await apiClient.get('/v1/events/for-you');
        if (response && response.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch following events (secondary tab, but warm the cache)
    queryClient.prefetchQuery({
      queryKey: queryKeys.followingEvents(),
      queryFn: async () => {
        const response = await apiClient.get('/v1/events/following');
        if (response && response.data) return response.data;
        return [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch event invites
    queryClient.prefetchQuery({
      queryKey: queryKeys.eventInvites('pending'),
      queryFn: async () => {
        const response = await apiClient.get('/v1/events/invites?status=pending');
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch cohost invites
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.myCohostInvites(), 'pending'],
      queryFn: async () => {
        const response = await apiClient.get('/v1/user/cohost-invites?status=pending');
        return response.data || [];
      },
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch blog posts if Ghost is configured
    if (Env.NEXT_PUBLIC_GHOST_URL && Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.blogPosts({ limit: 10, filter: 'tag:hub' }),
        queryFn: async () => {
          const res = await fetch(
            `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&filter=tag:hub&include=tags,authors&limit=10`
          );
          if (!res.ok) throw new Error(`Ghost API error: ${res.status}`);
          const data = await res.json();
          return data.posts || [];
        },
        staleTime: 30 * 60 * 1000,
      });
    }
  }, [queryClient]);
}
