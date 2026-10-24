import apiClient from '@/lib/api/client';
import { translateHooks } from '@/lib/i18n/active-translator';
import { queryKeys } from '@/lib/query-client';
import type { ApiError, ApiResponse } from '@/lib/types/api';
import type { EventDashboard } from '@/lib/types/manage';
import { useQuery } from '@tanstack/react-query';

const NON_RETRYABLE_STATUSES = [403, 404];

async function getEventDashboard(eventId: string): Promise<EventDashboard> {
  const response = await apiClient.get<ApiResponse<EventDashboard>>(
    `/v1/events/${eventId}/dashboard`,
    {
      suppressErrorStatuses: NON_RETRYABLE_STATUSES,
    }
  );

  if (response?.data) {
    return response.data;
  }

  const error: ApiError = { success: false, message: translateHooks('events.dashboardLoadFailed') };
  throw error;
}

export function useEventDashboard(eventId: string) {
  return useQuery<EventDashboard, ApiError>({
    queryKey: queryKeys.eventDashboard(eventId),
    queryFn: () => getEventDashboard(eventId),
    enabled: !!eventId,
    staleTime: 30_000,
    retry: (failureCount, error) =>
      !NON_RETRYABLE_STATUSES.includes(error?.status ?? -1) && failureCount < 2,
  });
}
