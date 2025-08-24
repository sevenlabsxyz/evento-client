import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { apiClient } from '../api/client';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/auth-store';
import { ApiResponse, UserDetails } from '../types/api';

// Query keys
const USER_PROFILE_QUERY_KEY = ['user', 'profile'] as const;

/**
 * Hook to fetch and manage user profile data
 */
export function useUserProfile() {
  const { user, setUser, clearAuth } = useAuthStore();

  // Query to fetch current user profile
  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as { message: string };
        if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
          return false;
        }
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Sync profile data with auth store
  React.useEffect(() => {
    if (profileData) {
      setUser(profileData);
    } else if (error) {
      // Clear auth on 401 errors
      const apiError = error as { message?: string };
      if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        clearAuth();
      }
    }
  }, [profileData, error, setUser, clearAuth]);

  return {
    user: profileData || user,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!profileData,
  };
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<UserDetails>) => {
      // Only send the fields that are being updated
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined || value !== null)
      );

      const response = await apiClient.patch<UserDetails[]>('/v1/user', filteredUpdates);
      return response.data?.[0] || null;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the query cache
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedUser);
        // Update the auth store
        setUser(updatedUser);
      }
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
}

/**
 * Hook to upload profile image
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post<UserDetails[]>(
        '/v1/user/details/image-upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data?.[0] || null;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the query cache
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedUser);
        // Update the auth store
        setUser(updatedUser);
      }
    },
    onError: (error) => {
      console.error('Profile image upload failed:', error);
    },
  });
}

/**
 * Hook to search for users
 */
export function useSearchUsers() {
  return useMutation({
    mutationFn: async (query: string) => {
      const response = await apiClient.get<UserDetails[] | { data: UserDetails[] }>(
        `/v1/user/search?s=${encodeURIComponent(query)}`
      );

      // Handle both response formats (array or object with data property)
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        return (response as any).data || [];
      }

      return [];
    },
    onError: (error) => {
      console.error('User search failed:', error);
    },
  });
}

/**
 * Hook to check if the current user follows another user
 */
export function useFollowStatus(userId: string) {
  return useQuery({
    queryKey: ['user', 'follow', 'status', userId],
    queryFn: async () => {
      if (!userId) return { isFollowing: false };

      const response = await apiClient.get<{ isFollowing: boolean }>(
        `/v1/user/follow?id=${userId}`
      );
      return response.data || { isFollowing: false };
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute - shorter time because follow status might change frequently
  });
}

/**
 * Hook to follow or unfollow a user
 */
export function useFollowAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      let response;
      if (action === 'follow') {
        response = await apiClient.post('/v1/user/follow', {
          followId: userId,
        });
      } else {
        response = await apiClient.delete('/v1/user/follow', {
          data: {
            followId: userId,
          },
        });
      }
      return { data: response.data, action };
    },
    onSuccess: (_result, variables) => {
      const { action, userId } = variables;
      const isFollowing = action === 'follow';

      // Update follow status in cache
      queryClient.setQueryData(['user', 'follow', 'status', userId], {
        isFollowing,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user', 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'following'] });
    },
    onError: (error, variables) => {
      const { action } = variables;
      console.error(`${action === 'follow' ? 'Follow' : 'Unfollow'} failed:`, error);
    },
  });
}

/**
 * Hook to get user's followers
 */
export function useUserFollowers(userId: string) {
  return useQuery({
    queryKey: ['user', 'followers', userId],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(`/v1/user/followers/list?id=${userId}`);
      // Transform the API response to match UI expectations
      const transformedData = (response.data || []).map((item: any) => ({
        id: item.user_details?.id || item.follower_id,
        username: item.user_details?.username || '',
        name: item.user_details?.name || '',
        image: item.user_details?.image || '',
        verification_status: item.user_details?.verification_status || '',
      }));
      return transformedData as UserDetails[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get user's following
 */
export function useUserFollowing(userId: string) {
  return useQuery({
    queryKey: ['user', 'following', userId],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(`/v1/user/follows/list?id=${userId}`);
      // Transform the API response to match UI expectations
      const transformedData = (response.data || []).map((item: any) => ({
        id: item.user_details?.id || item.followed_id,
        username: item.user_details?.username || '',
        name: item.user_details?.name || '',
        image: item.user_details?.image || '',
        verification_status: item.user_details?.verification_status || '',
      }));
      return transformedData as UserDetails[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get user's event count
 */
export function useUserEventCount(userId: string) {
  return useQuery({
    queryKey: ['user', 'events', 'count', userId],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(`/v1/user/events/count?id=${userId}`);
      return response.data?.count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user profile by username
 */
export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['user', 'profile', 'username', username],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserDetails[]>>(
        `/v1/user/details?username=${encodeURIComponent(username)}`
      );

      // Extract the users array from the API response
      const user = response?.data || {};

      if (!user) {
        return null;
      }

      // Return the first user
      return user || null;
    },
    enabled: !!username,
    staleTime: 1 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (user not found)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number };
        if (apiError.status === 404) return false;
      }
      return failureCount < 3;
    },
  });
}
