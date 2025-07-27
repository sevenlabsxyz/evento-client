import { apiClient } from '@/lib/api/client';
import { EventWithUser, UserDetails } from '@/lib/types/api';
import { transformApiEventResponse } from '@/lib/utils/api-transform';
import { debugError } from '@/lib/utils/debug';
import { useQuery } from '@tanstack/react-query';

// Helper function to create dummy user details
const createDummyUserDetails = (id: string, name: string): UserDetails => ({
  id,
  username: name.toLowerCase().replace(/\s+/g, ''),
  name,
  bio: `Event organizer for ${name}`,
  image: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50)}.jpg`,
  bio_link: '',
  x_handle: '',
  instagram_handle: '',
  ln_address: '',
  nip05: '',
  verification_status: null,
  verification_date: new Date().toISOString(),
});

// Export the dummy sub-events for testing
export const dummySubEvents: EventWithUser[] = [
  {
    id: 'sub-1',
    title: 'Pre-Event Mixer',
    description: 'Join us for drinks and mingling before the main event!',
    cover:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80',
    location: 'The Grand Ballroom',
    timezone: 'UTC',
    status: 'published',
    visibility: 'public',
    cost: null,
    creator_user_id: 'host-1',

    // Date components
    start_date_day: new Date().getDate() + 2,
    start_date_month: new Date().getMonth() + 1,
    start_date_year: new Date().getFullYear(),
    start_date_hours: 18,
    start_date_minutes: 0,

    end_date_day: new Date().getDate() + 2,
    end_date_month: new Date().getMonth() + 1,
    end_date_year: new Date().getFullYear(),
    end_date_hours: 20,
    end_date_minutes: 0,

    // Computed dates
    computed_start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    computed_end_date: new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),

    // Media & Links
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // User details
    user_details: createDummyUserDetails('host-1', 'Event Organizer'),
  },
  {
    id: 'sub-2',
    title: 'After Party',
    description: 'Continue the celebration after the main event!',
    cover:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    location: 'The Rooftop Lounge',
    timezone: 'UTC',
    status: 'published',
    visibility: 'public',
    cost: 20,
    creator_user_id: 'host-1',

    // Date components
    start_date_day: new Date().getDate() + 3,
    start_date_month: new Date().getMonth() + 1,
    start_date_year: new Date().getFullYear(),
    start_date_hours: 22,
    start_date_minutes: 0,

    end_date_day: new Date().getDate() + 4,
    end_date_month: new Date().getMonth() + 1,
    end_date_year: new Date().getFullYear(),
    end_date_hours: 2,
    end_date_minutes: 0,

    // Computed dates
    computed_start_date: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000
    ).toISOString(),
    computed_end_date: new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),

    // Media & Links
    spotify_url: 'https://open.spotify.com/artist/example',
    wavlake_url: 'https://wavlake.com/artist/example',
    contrib_cashapp: '$eventorg',
    contrib_venmo: '@eventorg',
    contrib_paypal: 'paypal.me/eventorg',
    contrib_btclightning: 'eventorg@getalby.com',

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // User details
    user_details: createDummyUserDetails('host-2', 'After Party Organizer'),
  },
];

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
        return responseData.length > 0
          ? responseData.map((event) => {
              const transformed = transformApiEventResponse({
                ...event,
                // Ensure required fields are present
                computed_start_date: event.computed_start_date || new Date().toISOString(),
                timezone: event.timezone || 'UTC',
                user_details:
                  event.user_details || createDummyUserDetails('unknown', 'Unknown User'),
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
            })
          : dummySubEvents;
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
