import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type { EventInviteRecord, EventInviteStatusFilter } from '@/lib/types/manage';
import { useQuery } from '@tanstack/react-query';

/**
 * Invites sent for an event, newest first (host only)
 */
export function useEventInvitesList(eventId: string, status: EventInviteStatusFilter = 'all') {
  return useQuery({
    queryKey: queryKeys.eventInvitesList(eventId, status),
    queryFn: async (): Promise<EventInviteRecord[]> => {
      const response = await apiClient.get<ApiResponse<EventInviteRecord[]>>(
        `/v1/events/${eventId}/invites`,
        { params: { status } }
      );

      return Array.isArray(response?.data) ? response.data : [];
    },
    enabled: !!eventId,
  });
}
