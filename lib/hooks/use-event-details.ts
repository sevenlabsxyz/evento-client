import { apiClient } from '@/lib/api/client';
import { ApiResponse, Event } from '@/lib/types/api';
import { transformApiEventResponse } from '@/lib/utils/api-transform';
import { debugError } from '@/lib/utils/debug';
import { useQuery } from '@tanstack/react-query';

export function useEventDetails(eventId: string) {
  return useQuery({
    queryKey: ['event', 'details', eventId],
    queryFn: async (): Promise<Event> => {
      try {
        console.log('[useEventDetails] ========== FETCH EVENT ==========');
        console.log('[useEventDetails] Fetching event:', eventId);

        const response = await apiClient.get<ApiResponse<Event>>(`/v1/events/${eventId}`);

        console.log('[useEventDetails] Raw API response:', JSON.stringify(response, null, 2));

        // Handle the response structure { success, message, data }
        if (!response || typeof response !== 'object') {
          debugError(
            'useEventDetails',
            'Invalid response format',
            new Error('Response is not an object'),
            { response, type: typeof response }
          );
          throw new Error('Invalid response format');
        }

        // Check if it's the expected API response structure
        let eventData: Event;

        if ('success' in response && 'data' in response) {
          eventData = response.data;
        } else {
          eventData = response;
        }

        console.log('[useEventDetails] Event data extracted:', JSON.stringify(eventData, null, 2));
        console.log(
          '[useEventDetails] event_locations:',
          JSON.stringify((eventData as any).event_locations, null, 2)
        );
        console.log('[useEventDetails] location:', (eventData as any).location);
        console.log('[useEventDetails] location_id:', (eventData as any).location_id);

        // Transform the response to ensure correct format
        const transformed = transformApiEventResponse(eventData);

        console.log('[useEventDetails] After transform:', JSON.stringify(transformed, null, 2));
        console.log(
          '[useEventDetails] Transformed event_locations:',
          JSON.stringify((transformed as any)?.event_locations, null, 2)
        );

        if (!transformed) {
          debugError(
            'useEventDetails',
            'Failed to transform API response',
            new Error('Transformation returned null'),
            { eventData }
          );
          throw new Error('Failed to transform event data');
        }

        return transformed as Event;
      } catch (error) {
        debugError('useEventDetails', 'Failed to fetch event details', error, {
          eventId,
        });
        throw error;
      }
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}
