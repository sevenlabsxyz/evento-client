'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { 
  useFollowStatus,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
} from './use-user-profile';

interface QuickProfileData {
  followStatus: { isFollowing: boolean } | undefined;
  eventCount: number;
  followers: any[];
  following: any[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Optimized hook that efficiently fetches all user profile data needed for QuickProfileSheet
 * Uses React Query's parallel queries for better performance
 */
export function useQuickProfileData(userId: string): QuickProfileData {
  const followStatusQuery = useFollowStatus(userId);
  const eventCountQuery = useUserEventCount(userId);
  const followersQuery = useUserFollowers(userId);
  const followingQuery = useUserFollowing(userId);

  // Combine loading states - we only show loading when critical data (follow status) is loading
  const isLoading = followStatusQuery.isLoading;

  // Collect any errors from the queries
  const error = followStatusQuery.error || 
                eventCountQuery.error || 
                followersQuery.error || 
                followingQuery.error;

  return {
    followStatus: followStatusQuery.data,
    eventCount: eventCountQuery.data || 0,
    followers: followersQuery.data || [],
    following: followingQuery.data || [],
    isLoading,
    error,
  };
}

/**
 * Preload profile data for better performance when user hovers over avatar
 * This can be called on mouse enter events to prefetch data
 */
export function prefetchQuickProfileData(userId: string, queryClient: any) {
  // Prefetch all the data that will be needed
  const queries = [
    { queryKey: ['followStatus', userId], enabled: false },
    { queryKey: ['userEventCount', userId], enabled: false },
    { queryKey: ['userFollowers', userId], enabled: false },
    { queryKey: ['userFollowing', userId], enabled: false },
  ];

  // Prefetch each query if not already cached
  queries.forEach(({ queryKey }) => {
    queryClient.prefetchQuery({
      queryKey,
      staleTime: 30000, // Consider data fresh for 30 seconds
    });
  });
}