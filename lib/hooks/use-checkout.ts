'use client';

import { apiClient } from '@/lib/api/client';
import {
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  OrderStatusResponse,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCheckout(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<CheckoutResponse, Error, CheckoutRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<CheckoutResponse>>(
        `/v1/events/${eventId}/checkout`,
        data
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to create order');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate ticket types to refresh availability
      queryClient.invalidateQueries({
        queryKey: ['event', 'ticket-types', eventId],
      });
    },
  });
}

export function useOrderStatus(orderId: string | null, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['order', 'status', orderId],
    queryFn: async (): Promise<OrderStatusResponse> => {
      const response = await apiClient.get<ApiResponse<OrderStatusResponse>>(
        `/v1/orders/${orderId}/status`
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to get order status');
      }
      return response.data;
    },
    enabled: enabled && !!orderId,
    refetchInterval: (query) => {
      // Poll every 3 seconds while pending
      const data = query.state.data;
      if (data?.status === 'pending') return 3000;
      return false;
    },
    retry: false,
  });
}
