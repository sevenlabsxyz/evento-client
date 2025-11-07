import { apiClient } from '@/lib/api/client';
import { ApiResponse, InterestWithParent } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

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
