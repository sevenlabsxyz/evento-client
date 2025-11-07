import { apiClient } from '@/lib/api/client';
import { ApiResponse, UserPrompt } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch the authenticated user's prompts (includes hidden prompts)
 */
export function useUserPrompts() {
  return useQuery({
    queryKey: ['user', 'prompts'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserPrompt[]>>('/v1/user/prompts');
      return response.data;
    },
  });
}

/**
 * Hook to fetch another user's prompts by user ID (only visible prompts)
 */
export function useOtherUserPrompts(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'prompts'],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await apiClient.get<ApiResponse<UserPrompt[]>>(
        `/v1/users/${userId}/prompts`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}
