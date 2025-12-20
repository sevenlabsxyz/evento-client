'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, Attendee, SalesSummary } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

export function useEventSales(eventId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['event', 'sales', eventId],
    queryFn: async (): Promise<SalesSummary> => {
      const response = await apiClient.get<ApiResponse<SalesSummary>>(
        `/v1/events/${eventId}/sales`
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to get sales data');
      }
      return response.data;
    },
    enabled: enabled && !!eventId,
    staleTime: 30 * 1000, // 30 seconds - sales data should be relatively fresh
  });
}

interface AttendeesResponse {
  attendees: Attendee[];
}

export function useEventAttendees(eventId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['event', 'attendees', eventId],
    queryFn: async (): Promise<AttendeesResponse> => {
      const response = await apiClient.get<ApiResponse<AttendeesResponse>>(
        `/v1/events/${eventId}/attendees`
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to get attendees');
      }
      return response.data;
    },
    enabled: enabled && !!eventId,
    staleTime: 30 * 1000,
  });
}
