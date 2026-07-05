import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { EventWithUser } from '@/lib/types/api';
import { transformApiEventResponse } from '@/lib/utils/api-transform';
import { debugError } from '@/lib/utils/debug';
import { useQuery } from '@tanstack/react-query';

interface UseSubEventsOptions {
  /** Include draft sub-events — only honored by the API for hosts of the parent event */
  includeDrafts?: boolean;
}

export function useSubEvents(eventId?: string, options: UseSubEventsOptions = {}) {
  const { includeDrafts = false } = options;

  return useQuery<EventWithUser[]>({
    queryKey: [...queryKeys.eventSubEvents(eventId ?? ''), { includeDrafts }],
    queryFn: async (): Promise<EventWithUser[]> => {
      try {
        if (!eventId) {
          return [];
        }

        const response = await apiClient.get<EventWithUser[]>(
          `/v1/events/${eventId}/sub-events${includeDrafts ? '?include_drafts=true' : ''}`
        );

        // The API client interceptor returns response.data directly
        const responseData = response;

        // Check if it's the expected array format
        if (!responseData || !Array.isArray(responseData)) {
          debugError(
            'useSubEvents',
            'Invalid response format',
            new Error('Expected array of events'),
            { responseData, type: typeof responseData }
          );
          throw new Error('Invalid response format');
        }

        // Transform each event in the array
        const transformedEvents = responseData.map((event) => {
          const transformed = transformApiEventResponse({
            ...event,
            // Ensure required fields are present
            computed_start_date: event.computed_start_date || new Date().toISOString(),
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

        return transformedEvents;
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
