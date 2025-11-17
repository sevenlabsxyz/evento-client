import { apiClient } from '@/lib/api/client';
import { ApiResponse, Interest, InterestWithParent } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch the authenticated user's interests
 */
export function useUserInterests() {
  return useQuery({
    queryKey: ['user', 'interests'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<InterestWithParent[]>>('/v1/user/interests');
      return response.data;
    },
  });
}

/**
 * Hook to fetch another user's interests by user ID
 */
export function useOtherUserInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'interests'],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await apiClient.get<ApiResponse<InterestWithParent[]>>(
        `/v1/users/${userId}/interests`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch all available interests
 */
export function useAllInterests(includeChildren = true, parentOnly = false) {
  return useQuery({
    queryKey: ['interests', 'all', includeChildren, parentOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!includeChildren) params.append('include_children', 'false');
      if (parentOnly) params.append('parent_only', 'true');

      const response = await apiClient.get<ApiResponse<Interest[]>>(
        `/v1/interests${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - interests don't change often
  });
}

/**
 * Hook to add interests to user profile
 */
export function useAddInterests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interestIds: string[]) => {
      const response = await apiClient.post<ApiResponse<any>>('/v1/user/interests', {
        interest_ids: interestIds,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user interests query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'interests'] });
    },
  });
}

/**
 * Hook to replace all user interests
 */
export function useReplaceInterests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interestIds: string[]) => {
      const response = await apiClient.put<ApiResponse<InterestWithParent[]>>(
        '/v1/user/interests',
        {
          interest_ids: interestIds,
        }
      );
      return response.data || [];
    },
    onSuccess: (data) => {
      // Update the cache with the new interests
      queryClient.setQueryData(['user', 'interests'], data);
    },
  });
}

/**
 * Hook to remove a single interest
 */
export function useRemoveInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interestId: string) => {
      const response = await apiClient.delete<ApiResponse<any>>(`/v1/user/interests/${interestId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user interests query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'interests'] });
    },
  });
}
