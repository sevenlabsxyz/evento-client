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
        const response = await apiClient.get<ApiResponse<Event>>(
          `/v1/events/details?id=${eventId}`
        );

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
