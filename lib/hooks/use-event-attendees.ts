import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type {
  CheckInResult,
  CheckInVariables,
  EventAttendeesResponse,
  UndoCheckInResult,
} from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

function invalidateAttendeeQueries(queryClient: QueryClient, eventId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.eventAttendees(eventId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
}

/**
 * Ticket holders for an event (excluding cancelled tickets) with check-in summary
 */
export function useEventAttendees(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventAttendees(eventId),
    queryFn: async (): Promise<EventAttendeesResponse> => {
      const response = await apiClient.get<ApiResponse<EventAttendeesResponse>>(
        `/v1/events/${eventId}/attendees`
      );
      const data = response?.data;

      if (!data) {
        throw new Error('Failed to load attendees');
      }

      const attendees = Array.isArray(data.attendees) ? data.attendees : [];

      return {
        attendees,
        summary: data.summary ?? {
          total: attendees.length,
          checkedIn: attendees.filter((attendee) => attendee.status === 'used').length,
        },
      };
    },
    enabled: !!eventId,
  });
}

/**
 * Check a ticket in by QR token or (host manual check-in) by ticket id.
 * Invalid, cancelled, or already-used tickets resolve with `valid: false`.
 */
export function useCheckIn(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CheckInVariables): Promise<CheckInResult> => {
      const response = await apiClient.post<ApiResponse<CheckInResult>>(
        `/v1/events/${eventId}/check-in`,
        variables
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Check-in failed');
    },
    onSuccess: () => {
      invalidateAttendeeQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Check-in error', { error: getErrorMessage(error) });
    },
  });
}

export function useUndoCheckIn(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }): Promise<UndoCheckInResult> => {
      const response = await apiClient.delete<ApiResponse<UndoCheckInResult>>(
        `/v1/events/${eventId}/check-in`,
        { data: { ticketId } }
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Failed to undo check-in');
    },
    onSuccess: () => {
      invalidateAttendeeQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Undo check-in error', { error: getErrorMessage(error) });
    },
  });
}
