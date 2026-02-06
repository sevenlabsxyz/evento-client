import apiClient from '@/lib/api/client';
import { UpdateEventData, updateEventSchema } from '@/lib/schemas/event';
import { ApiResponse } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateEventResponse {
  id: string;
  title: string;
  [key: string]: any;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      // Validate data
      const validatedData = updateEventSchema.parse(data);

      // Make API call - eventId in path
      const response = await apiClient.patch<ApiResponse<UpdateEventResponse[]>>(
        `/v1/events/${validatedData.id}`,
        validatedData
      );

      // The API returns { success: true, data: [...] }
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      throw new Error('Failed to update event');
    },
    onSuccess: (data) => {
      // Invalidate related queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['event', 'details', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error: any) => {
      logger.error('Update event error', {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

/**
 * Hook for updating an event with custom callbacks
 * Useful when you need to handle success differently
 */
export function useUpdateEventWithCallbacks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      // Validate data
      const validatedData = updateEventSchema.parse(data);

      // Make API call - eventId in path
      const response = await apiClient.patch<ApiResponse<UpdateEventResponse[]>>(
        `/v1/events/${validatedData.id}`,
        validatedData
      );

      // The API returns { success: true, data: [...] }
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      throw new Error('Failed to update event');
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['event', 'details', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
