'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, PendingTicketClaim, TicketWithEvent } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface MyTicketsResponse {
  tickets: TicketWithEvent[];
}

interface PendingClaimsResponse {
  claims: PendingTicketClaim[];
}

export function useMyTickets(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['user', 'tickets'],
    queryFn: async (): Promise<MyTicketsResponse> => {
      const response = await apiClient.get<ApiResponse<MyTicketsResponse>>('/v1/user/tickets');
      if (response && response.data) {
        return response.data;
      }
      if (response && 'tickets' in response) {
        return { tickets: response.tickets as TicketWithEvent[] };
      }
      return { tickets: [] };
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingTicketClaims(options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['user', 'tickets', 'pending-claims'],
    queryFn: async (): Promise<PendingClaimsResponse> => {
      const response = await apiClient.get<ApiResponse<PendingClaimsResponse>>(
        '/v1/user/tickets/pending-claims'
      );
      if (response && response.data) {
        return response.data;
      }
      if (response && 'claims' in response) {
        return { claims: response.claims as PendingTicketClaim[] };
      }
      return { claims: [] };
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClaimTickets() {
  const queryClient = useQueryClient();

  return useMutation<{ claimedCount: number }, Error, void>({
    mutationFn: async () => {
      const response =
        await apiClient.post<ApiResponse<{ claimedCount: number }>>('/v1/user/tickets/claim');
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to claim tickets');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'tickets', 'pending-claims'] });
    },
  });
}

export function useTicketDetail(ticketId: string | null, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['ticket', 'detail', ticketId],
    queryFn: async (): Promise<TicketWithEvent> => {
      const response = await apiClient.get<ApiResponse<TicketWithEvent>>(`/v1/tickets/${ticketId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to get ticket');
      }
      return response.data;
    },
    enabled: enabled && !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}
