'use client';

import { apiClient } from '@/lib/api/client';
import {
  ApiResponse,
  CreateTicketTypeForm,
  TicketType,
  UpdateTicketTypeForm,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useTicketTypes(eventId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['event', 'ticket-types', eventId],
    queryFn: async (): Promise<TicketType[]> => {
      const response = await apiClient.get<ApiResponse<TicketType[]>>(
        `/v1/events/${eventId}/ticket-types`
      );
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (response && 'ticketTypes' in response && Array.isArray(response.ticketTypes)) {
        return response.ticketTypes as TicketType[];
      }
      return [];
    },
    enabled: enabled && !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<TicketType | null, Error, CreateTicketTypeForm>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<TicketType[]>>(
        `/v1/events/${eventId}/ticket-types`,
        data
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to create ticket type');
      }
      const arr = response?.data ?? [];
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'ticket-types', eventId],
      });
    },
  });
}

interface UpdateTicketTypeArgs {
  ticketTypeId: string;
  data: UpdateTicketTypeForm;
}

export function useUpdateTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<TicketType | null, Error, UpdateTicketTypeArgs>({
    mutationFn: async ({ ticketTypeId, data }) => {
      const response = await apiClient.patch<ApiResponse<TicketType[]>>(
        `/v1/events/${eventId}/ticket-types/${ticketTypeId}`,
        data
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update ticket type');
      }
      const arr = response?.data ?? [];
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'ticket-types', eventId],
      });
    },
  });
}

export function useDeleteTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (ticketTypeId) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/v1/events/${eventId}/ticket-types/${ticketTypeId}`
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete ticket type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'ticket-types', eventId],
      });
    },
  });
}
