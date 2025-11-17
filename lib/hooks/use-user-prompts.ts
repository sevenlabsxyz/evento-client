import { apiClient } from '@/lib/api/client';
import { ApiResponse, Prompt, UserPrompt } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

/**
 * Hook to fetch all available prompts
 */
export function useAllPrompts(category?: string, userId?: string, availableOnly = false) {
  return useQuery({
    queryKey: ['prompts', 'all', category, userId, availableOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (userId) params.append('user_id', userId);
      if (availableOnly) params.append('available_only', 'true');

      const response = await apiClient.get<ApiResponse<Prompt[]>>(
        `/v1/prompts${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - prompts don't change often
  });
}

/**
 * Hook to answer a prompt
 */
export function useAnswerPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { prompt_id: string; answer: string; display_order?: number }) => {
      const response = await apiClient.post<ApiResponse<UserPrompt>>('/v1/user/prompts', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user prompts query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'prompts'] });
      // Also invalidate available prompts
      queryClient.invalidateQueries({ queryKey: ['prompts', 'all'] });
    },
  });
}

/**
 * Hook to update a prompt answer
 */
export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userPromptId,
      data,
    }: {
      userPromptId: string;
      data: { answer?: string; display_order?: number; is_visible?: boolean };
    }) => {
      const response = await apiClient.patch<ApiResponse<UserPrompt>>(
        `/v1/user/prompts/${userPromptId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user prompts query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'prompts'] });
    },
  });
}

/**
 * Hook to delete a prompt answer
 */
export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPromptId: string) => {
      const response = await apiClient.delete<ApiResponse<any>>(`/v1/user/prompts/${userPromptId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user prompts query to refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'prompts'] });
      // Also invalidate available prompts
      queryClient.invalidateQueries({ queryKey: ['prompts', 'all'] });
    },
  });
}

/**
 * Hook to reorder prompts
 */
export function useReorderPrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prompts: { user_prompt_id: string; display_order: number }[]) => {
      const response = await apiClient.patch<ApiResponse<UserPrompt[]>>(
        '/v1/user/prompts/reorder',
        { prompts }
      );
      return response.data || [];
    },
    onSuccess: (data) => {
      // Update the cache with the reordered prompts
      queryClient.setQueryData(['user', 'prompts'], data);
    },
  });
}
