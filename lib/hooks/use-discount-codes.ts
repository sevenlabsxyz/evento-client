import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type {
  CreateDiscountCodeInput,
  DiscountCode,
  UpdateDiscountCodeInput,
} from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

export type UpdateDiscountCodeVariables = { codeId: string } & UpdateDiscountCodeInput;

function invalidateDiscountCodeQueries(queryClient: QueryClient, eventId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.eventDiscountCodes(eventId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.eventSales(eventId) });
}

/**
 * All discount codes for an event, newest first (host only)
 */
export function useDiscountCodes(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventDiscountCodes(eventId),
    queryFn: async (): Promise<DiscountCode[]> => {
      const response = await apiClient.get<ApiResponse<DiscountCode[]>>(
        `/v1/events/${eventId}/discount-codes`
      );

      return Array.isArray(response?.data) ? response.data : [];
    },
    enabled: !!eventId,
  });
}

export function useCreateDiscountCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDiscountCodeInput): Promise<DiscountCode> => {
      const response = await apiClient.post<ApiResponse<DiscountCode>>(
        `/v1/events/${eventId}/discount-codes`,
        input
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Failed to create discount code');
    },
    onSuccess: () => {
      invalidateDiscountCodeQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Create discount code error', { error: getErrorMessage(error) });
    },
  });
}

export function useUpdateDiscountCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      codeId,
      ...input
    }: UpdateDiscountCodeVariables): Promise<DiscountCode> => {
      const response = await apiClient.patch<ApiResponse<DiscountCode>>(
        `/v1/events/${eventId}/discount-codes/${codeId}`,
        input
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error('Failed to update discount code');
    },
    onSuccess: () => {
      invalidateDiscountCodeQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Update discount code error', { error: getErrorMessage(error) });
    },
  });
}

export function useDeleteDiscountCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeId: string): Promise<void> => {
      await apiClient.delete<ApiResponse<null>>(`/v1/events/${eventId}/discount-codes/${codeId}`);
    },
    onSuccess: () => {
      invalidateDiscountCodeQueries(queryClient, eventId);
    },
    onError: (error: unknown) => {
      logger.error('Delete discount code error', { error: getErrorMessage(error) });
    },
  });
}
