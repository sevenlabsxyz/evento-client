import { apiClient } from '@/lib/api/client';
import { EventWithUser } from '@/lib/types/api';
import { transformApiEventResponse } from '@/lib/utils/api-transform';
import { debugError } from '@/lib/utils/debug';
import { useQuery } from '@tanstack/react-query';

export function useSubEvents(eventId?: string) {
  return useQuery<EventWithUser[]>({
    queryKey: ['event', 'sub-events', eventId],
    queryFn: async (): Promise<EventWithUser[]> => {
      try {
        if (!eventId) {
          return [];
        }

        const response = await apiClient.get<EventWithUser[]>(
          `/v1/events/sub-events?event_id=${eventId}`
        );

        // Extract data from the Axios response
        const responseData = response.data;

        // Handle the response structure { success, message, data }
        if (!responseData || typeof responseData !== 'object') {
          debugError(
            'useSubEvents',
            'Invalid response format',
            new Error('Response data is not an object'),
            { responseData, type: typeof responseData }
          );
          throw new Error('Invalid response format');
        }

        // Check if it's the expected API response structure
        if (!responseData || !Array.isArray(responseData)) {
          debugError(
            'useSubEvents',
            'Invalid response data format',
            new Error('Expected success:true with data array'),
            { responseData }
          );
          throw new Error('Invalid response data format');
        }

        // Transform each event in the array
        return responseData.map((event) => {
          const transformed = transformApiEventResponse({
            ...event,
            // Ensure required fields are present
            computed_start_date:
              event.computed_start_date || new Date().toISOString(),
            timezone: event.timezone || 'UTC',
            user_details: event.user_details,
          });

          if (!transformed) {
            debugError(
              'useSubEvents',
              'Failed to transform API response for event',
              new Error('Transformation returned null'),
              { event }
            );
            throw new Error('Failed to transform event data');
          }
          return transformed as EventWithUser;
        });
      } catch (error) {
        debugError('useSubEvents', 'Failed to fetch sub-events', error, {
          eventId,
        });
        throw error;
      }
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
