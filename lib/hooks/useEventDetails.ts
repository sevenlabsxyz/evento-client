import { apiClient } from '@/lib/api/client';
import { ApiResponse, Event } from '@/lib/types/api';
import { transformApiEventResponse } from '@/lib/utils/api-transform';
import { debugApiResponse, debugError, debugLog } from '@/lib/utils/debug';
import { useQuery } from '@tanstack/react-query';

export function useEventDetails(eventId: string) {
  return useQuery({
    queryKey: ['event', 'details', eventId],
    queryFn: async (): Promise<Event> => {
      debugLog('useEventDetails', `Fetching event details for ID: ${eventId}`);

      try {
        const response = await apiClient.get<ApiResponse<Event>>(
          `/v1/events/details?id=${eventId}`
        );

        // Log the complete raw response
        debugApiResponse('useEventDetails', `/v1/events/details?id=${eventId}`, response);

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
        let eventData = response;

        if ('success' in response && 'data' in response) {
          debugLog('useEventDetails', 'Found API response structure', {
            success: response.success,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : [],
          });
          eventData = response.data;
        }

        // Transform the response to ensure correct format
        const transformed = transformApiEventResponse(eventData);
        if (!transformed) {
          debugError(
            'useEventDetails',
            'Failed to transform API response',
            new Error('Transformation returned null'),
            { eventData }
          );
          throw new Error('Failed to transform event data');
        }

        debugLog('useEventDetails', 'Returning transformed event data', {
          hasTransformed: !!transformed,
          transformedKeys: Object.keys(transformed),
        });

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
