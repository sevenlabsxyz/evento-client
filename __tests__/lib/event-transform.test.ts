import type { Event as ApiEvent } from '@/lib/types/api';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';

const baseApiEvent: ApiEvent = {
  id: 'event-1',
  title: 'Ocean Meetup',
  description: 'At the prime meridian',
  cover: '',
  location: 'Null Island',
  event_locations: {
    id: 'loc-1',
    name: 'Null Island',
    address: '0 Latitude Way',
    city: 'Null Island',
    state_province: null,
    country: 'Atlantic Ocean',
    latitude: 0,
    longitude: 0,
  },
  timezone: 'UTC',
  status: 'published',
  visibility: 'public',
  cost: null,
  creator_user_id: 'user-1',
  hosts: [],
  start_date_day: 7,
  start_date_month: 3,
  start_date_year: 2026,
  start_date_hours: 12,
  start_date_minutes: 0,
  end_date_day: 7,
  end_date_month: 3,
  end_date_year: 2026,
  end_date_hours: 14,
  end_date_minutes: 0,
  computed_start_date: '2026-03-07T12:00:00.000Z',
  computed_end_date: '2026-03-07T14:00:00.000Z',
  spotify_url: '',
  wavlake_url: '',
  contrib_cashapp: '',
  contrib_venmo: '',
  contrib_paypal: '',
  contrib_btclightning: '',
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
};

describe('transformApiEventToDisplay', () => {
  it('preserves zero coordinates from event_locations', () => {
    const result = transformApiEventToDisplay(baseApiEvent);

    expect(result.location.coordinates).toEqual({ lat: 0, lng: 0 });
  });

  it('skips hosts without user details', () => {
    const result = transformApiEventToDisplay(baseApiEvent, [
      { user_details: null },
      {
        user_details: {
          id: 'host-1',
          username: 'hostone',
          name: 'Host One',
          image: 'host.jpg',
          bio: 'Main host',
          verification_status: 'verified',
        },
      },
    ]);

    expect(result.hosts).toEqual([
      expect.objectContaining({
        id: 'host-1',
        username: 'hostone',
      }),
    ]);
  });
});
