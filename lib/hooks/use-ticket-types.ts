import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type { CreateTicketTypeInput, TicketType, UpdateTicketTypeInput } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

export type UpdateTicketTypeVariables = { ticketTypeId: string } & UpdateTicketTypeInput;

function invalidateTicketingQueries(queryClient: QueryClient, eventId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.eventTicketTypes(eventId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.eventSales(eventId) });
}

/**
 * Active ticket types for an event, ordered by sort_order
 */
export function useTicketTypes(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventTicketTypes(eventId),
    queryFn: async (): Promise<TicketType[]> => {
      const response = await apiClient.get<ApiResponse<TicketType[]>>(
        `/v1/events/${eventId}/ticket-types`
      );

      return Array.isArray(response?.data) ? response.data : [];
    },
    enabled: !!eventId,
  });
}

export function useCreateTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTicketTypeInput): Promise<TicketType> => {
      const response = await apiClient.post<ApiResponse<TicketType>>(
        `/v1/events/${eventId}/ticket-types`,
        input
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Failed to create ticket type');
    },
    onSuccess: () => {
      invalidateTicketingQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Create ticket type error', { error: getErrorMessage(error) });
    },
  });
}

export function useUpdateTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketTypeId,
      ...input
    }: UpdateTicketTypeVariables): Promise<TicketType> => {
      const response = await apiClient.patch<ApiResponse<TicketType>>(
        `/v1/events/${eventId}/ticket-types/${ticketTypeId}`,
        input
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Failed to update ticket type');
    },
    onSuccess: () => {
      invalidateTicketingQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Update ticket type error', { error: getErrorMessage(error) });
    },
  });
}

export function useDeleteTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketTypeId: string): Promise<void> => {
      await apiClient.delete<ApiResponse<null>>(
        `/v1/events/${eventId}/ticket-types/${ticketTypeId}`
      );
    },
    onSuccess: () => {
      invalidateTicketingQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Delete ticket type error', { error: getErrorMessage(error) });
    },
  });
}
