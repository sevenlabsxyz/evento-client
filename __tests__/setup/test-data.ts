import { CreateEventData } from '@/lib/schemas/event';

export function makeCreateEvent(overrides: Partial<CreateEventData> = {}): CreateEventData {
  return {
    title: 'My Test Event',
    description: 'Test description',
    location: '123 Test St',
    timezone: 'UTC',
    cover: null,
    start_date_day: 1,
    start_date_month: 1,
    start_date_year: 2025,
    start_date_hours: 10,
    start_date_minutes: 0,
    end_date_day: 1,
    end_date_month: 1,
    end_date_year: 2025,
    end_date_hours: 12,
    end_date_minutes: 0,
    visibility: 'private',
    status: 'published',
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',
    cost: '',
    settings: { max_capacity: 100, show_capacity_count: true },
    ...overrides,
  };
}
