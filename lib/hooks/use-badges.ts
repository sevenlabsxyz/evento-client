import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse } from '@/lib/types/api';
import { UpdateUserBadgeRequest, UserBadge } from '@/lib/types/badges';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch the authenticated user's earned badges
 */
export function useUserBadges() {
  return useQuery({
    queryKey: queryKeys.userBadges(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserBadge[]>>('/v1/user/badges');
      return response.data;
    },
  });
}

/**
 * Hook to fetch another user's displayed badges (max 5, ordered by display_order)
 */
export function usePublicUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.publicUserBadges(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await apiClient.get<ApiResponse<UserBadge[]>>(`/v1/users/${userId}/badges`);
      return response.data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to update a user badge (display_order or mark_seen)
 */
export function useUpdateUserBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ badgeId, data }: { badgeId: string; data: UpdateUserBadgeRequest }) => {
      const response = await apiClient.patch<ApiResponse<UserBadge>>(
        `/v1/user/badges/${badgeId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user badges query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userBadges() });
    },
  });
}

/**
 * Hook to batch update multiple user badges (for reordering display slots)
 */
export function useBatchUpdateUserBadges() {
  const queryClient = useQueryClient();
  const updateBadge = useUpdateUserBadge();

  return useMutation({
    mutationFn: async (updates: Array<{ badgeId: string; display_order: number | null }>) => {
      // Update all badges in parallel
      await Promise.all(
        updates.map(({ badgeId, display_order }) =>
          apiClient.patch<ApiResponse<UserBadge>>(`/v1/user/badges/${badgeId}`, { display_order })
        )
      );
    },
    onSuccess: () => {
      // Invalidate user badges query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.userBadges() });
    },
  });
}
