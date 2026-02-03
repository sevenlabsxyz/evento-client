'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, EventRSVP, RSVPStatus } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useUserRSVP(eventId: string) {
  return useQuery<{ status: RSVPStatus | null; rsvp: EventRSVP | null }, Error>({
    queryKey: ['event', 'user-rsvp', eventId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<EventRSVP[]>>(`/v1/events/${eventId}/rsvps/me`);
      const rsvp =
        Array.isArray(res.data) && res.data.length > 0 ? (res.data[0] as EventRSVP) : null;
      return { status: (rsvp?.status as RSVPStatus) ?? null, rsvp };
    },
    enabled: !!eventId,
    staleTime: 60_000, // 1 min
  });
}
