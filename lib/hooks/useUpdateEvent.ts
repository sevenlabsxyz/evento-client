import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/utils/toast';
import apiClient from '@/lib/api/client';
import { UpdateEventData, updateEventSchema } from '@/lib/schemas/event';
import { ApiResponse } from '@/lib/types/api';

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
      
      // Make API call - Note: the backend expects the ID in the body
      const response = await apiClient.patch<ApiResponse<UpdateEventResponse[]>>(
        '/v1/events/details',
        validatedData
      );
      
      // The API returns { success: true, data: [...] }
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      
      throw new Error('Failed to update event');
    },
    onSuccess: (data) => {
      toast.success('Event updated successfully!');
      
      // Invalidate related queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['event', 'details', data.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error: any) => {
      console.error('Update event error:', error);
      toast.error(error.message || 'Failed to update event');
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
      
      // Make API call
      const response = await apiClient.patch<ApiResponse<UpdateEventResponse[]>>(
        '/v1/events/details',
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
      queryClient.invalidateQueries({ queryKey: ['event', 'details', data.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}