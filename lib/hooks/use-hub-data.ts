'use client';

import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ApiResponse, HubPayload } from '@/lib/types/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface UseHubDataOptions {
  enabled?: boolean;
  myUpcomingLimit?: number;
  discoverLimit?: number;
  pendingInvitesLimit?: number;
  pendingCohostLimit?: number;
}

function buildHubQueryString(options: UseHubDataOptions) {
  const params = new URLSearchParams();

  if (options.myUpcomingLimit) {
    params.set('my_upcoming_limit', String(options.myUpcomingLimit));
  }

  if (options.discoverLimit) {
    params.set('discover_limit', String(options.discoverLimit));
  }

  if (options.pendingInvitesLimit) {
    params.set('pending_invites_limit', String(options.pendingInvitesLimit));
  }

  if (options.pendingCohostLimit) {
    params.set('pending_cohost_limit', String(options.pendingCohostLimit));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export function useHubData(options: UseHubDataOptions = {}) {
  const {
    enabled = true,
    myUpcomingLimit = 6,
    discoverLimit = 12,
    pendingInvitesLimit = 10,
    pendingCohostLimit = 10,
  } = options;
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const query = useQuery<HubPayload, Error>({
    queryKey: queryKeys.hubData({
      myUpcomingLimit,
      discoverLimit,
      pendingInvitesLimit,
      pendingCohostLimit,
    }),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<HubPayload>>(
        `/v1/hub${buildHubQueryString({
          myUpcomingLimit,
          discoverLimit,
          pendingInvitesLimit,
          pendingCohostLimit,
        })}`
      );

      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 401) {
        return false;
      }

      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (!query.data?.viewer) {
      return;
    }

    setUser(query.data.viewer);
    queryClient.setQueryData(['auth', 'user'], query.data.viewer);
    queryClient.setQueryData(['user', 'profile'], query.data.viewer);
  }, [query.data, queryClient, setUser]);

  return query;
}
