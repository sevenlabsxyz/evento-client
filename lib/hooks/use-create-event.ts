import apiClient from '@/lib/api/client';
import { CreateEventData, createEventSchema } from '@/lib/schemas/event';
import { ApiResponse } from '@/lib/types/api';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface CreateEventResponse {
  id: string;
  title: string;
  [key: string]: any;
}

export function useCreateEvent() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      // Validate data
      const validatedData = createEventSchema.parse(data);

      // DEBUG: Log what we're sending to the API
      console.log('[useCreateEvent] ========== CREATE EVENT REQUEST ==========');
      console.log('[useCreateEvent] Raw input data:', JSON.stringify(data, null, 2));
      console.log('[useCreateEvent] Validated data:', JSON.stringify(validatedData, null, 2));
      console.log(
        '[useCreateEvent] Location specifically:',
        JSON.stringify(data.location, null, 2)
      );

      // Make API call
      const response = await apiClient.post<ApiResponse<CreateEventResponse[]>>(
        '/v1/events',
        validatedData
      );

      // DEBUG: Log the full API response
      console.log('[useCreateEvent] ========== API RESPONSE ==========');
      console.log('[useCreateEvent] Full response:', JSON.stringify(response, null, 2));
      console.log('[useCreateEvent] response.data:', JSON.stringify(response?.data, null, 2));
      if (response?.data?.[0]) {
        console.log('[useCreateEvent] Created event:', JSON.stringify(response.data[0], null, 2));
        console.log(
          '[useCreateEvent] event_locations in response:',
          JSON.stringify(response.data[0].event_locations, null, 2)
        );
        console.log('[useCreateEvent] location in response:', response.data[0].location);
        console.log('[useCreateEvent] location_id in response:', response.data[0].location_id);
      }

      // The API returns { success: true, data: [...] }
      // Check if response has the expected structure
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      throw new Error('Failed to create event');
    },
    onSuccess: (data) => {
      console.log('[useCreateEvent] ========== SUCCESS ==========');
      console.log('[useCreateEvent] Final data passed to redirect:', JSON.stringify(data, null, 2));
      // Navigate to the created event
      router.push(`/e/${data.id}`);
    },
    onError: (error: any) => {
      console.error('[useCreateEvent] ========== ERROR ==========');
      console.error('Create event error:', error);
    },
  });
}

/**
 * Hook for creating an event with custom callbacks
 * Useful when you need to handle success differently
 */
export function useCreateEventWithCallbacks() {
  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      // Validate data
      const validatedData = createEventSchema.parse(data);

      // DEBUG: Log what we're sending to the API
      console.log('[useCreateEventWithCallbacks] ========== CREATE EVENT REQUEST ==========');
      console.log('[useCreateEventWithCallbacks] Raw input data:', JSON.stringify(data, null, 2));
      console.log(
        '[useCreateEventWithCallbacks] Location specifically:',
        JSON.stringify(data.location, null, 2)
      );

      // Make API call
      const response = await apiClient.post<ApiResponse<CreateEventResponse[]>>(
        '/v1/events',
        validatedData
      );

      // DEBUG: Log the full API response
      console.log('[useCreateEventWithCallbacks] ========== API RESPONSE ==========');
      console.log(
        '[useCreateEventWithCallbacks] Full response:',
        JSON.stringify(response, null, 2)
      );
      if (response?.data?.[0]) {
        console.log(
          '[useCreateEventWithCallbacks] Created event:',
          JSON.stringify(response.data[0], null, 2)
        );
        console.log(
          '[useCreateEventWithCallbacks] event_locations:',
          JSON.stringify(response.data[0].event_locations, null, 2)
        );
        console.log('[useCreateEventWithCallbacks] location:', response.data[0].location);
        console.log('[useCreateEventWithCallbacks] location_id:', response.data[0].location_id);
      }

      // The API returns { success: true, data: [...] }
      // Check if response has the expected structure
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }

      throw new Error('Failed to create event');
    },
  });
}
