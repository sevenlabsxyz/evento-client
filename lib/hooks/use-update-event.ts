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
      const validatedData = updateEventSchema.parse(data);

      const response = await apiClient.patch<
        ApiResponse<UpdateEventResponse | UpdateEventResponse[]>
      >(`/v1/events/${validatedData.id}`, validatedData);

      if (response && response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0];
        }
        if (!Array.isArray(response.data)) {
          return response.data;
        }
      }

      throw new Error('Failed to update event');
    },
    onSuccess: (data) => {
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

export function useUpdateEventWithCallbacks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      const validatedData = updateEventSchema.parse(data);

      const response = await apiClient.patch<
        ApiResponse<UpdateEventResponse | UpdateEventResponse[]>
      >(`/v1/events/${validatedData.id}`, validatedData);

      if (response && response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0];
        }
        if (!Array.isArray(response.data)) {
          return response.data;
        }
      }

      throw new Error('Failed to update event');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'details', data.id],
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
