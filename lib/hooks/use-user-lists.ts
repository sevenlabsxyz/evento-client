'use client';

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, UserList } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

/**
 * Hook to fetch all lists for the current user
 * Lists are ordered: default list first, then by creation date
 */
export function useUserLists(enabled: boolean = true) {
  const t = useTranslations('hooks');
  return useQuery<UserList[], Error>({
    queryKey: queryKeys.userLists(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserList[]>>('/v1/user/lists');

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('lists.fetchFailed'));
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
