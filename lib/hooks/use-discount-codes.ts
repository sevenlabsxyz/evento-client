'use client';

import { apiClient } from '@/lib/api/client';
import {
  ApiResponse,
  CreateDiscountCodeForm,
  DiscountCode,
  ValidateDiscountResponse,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useDiscountCodes(eventId: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: ['event', 'discount-codes', eventId],
    queryFn: async (): Promise<DiscountCode[]> => {
      const response = await apiClient.get<ApiResponse<DiscountCode[]>>(
        `/v1/events/${eventId}/discount-codes`
      );
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (response && 'discountCodes' in response && Array.isArray(response.discountCodes)) {
        return response.discountCodes as DiscountCode[];
      }
      return [];
    },
    enabled: enabled && !!eventId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateDiscountCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<DiscountCode | null, Error, CreateDiscountCodeForm>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<DiscountCode[]>>(
        `/v1/events/${eventId}/discount-codes`,
        data
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to create discount code');
      }
      const arr = response?.data ?? [];
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'discount-codes', eventId],
      });
    },
  });
}

export function useDeleteDiscountCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (discountCodeId) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/v1/events/${eventId}/discount-codes/${discountCodeId}`
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete discount code');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'discount-codes', eventId],
      });
    },
  });
}

export function useValidateDiscountCode(eventId: string) {
  return useMutation<ValidateDiscountResponse, Error, string>({
    mutationFn: async (code) => {
      const response = await apiClient.post<ApiResponse<ValidateDiscountResponse>>(
        `/v1/events/${eventId}/checkout/validate-discount`,
        { code }
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Invalid discount code');
      }
      return response.data;
    },
  });
}
