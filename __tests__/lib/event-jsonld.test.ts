import type { EventSeoRecord } from '@/lib/seo/event-jsonld';
import { buildEventJsonLd, serializeJsonLd } from '@/lib/seo/event-jsonld';

const baseEvent: EventSeoRecord = {
  id: 'evt_123',
  title: 'TabConf Vegas',
  description: '<p>Hello<br />world</p>',
  location: 'UNLV, Las Vegas, NV, USA',
  event_locations: {
    id: 'loc_123',
    name: 'UNLV',
    address: '4505 S Maryland Pkwy',
    city: 'Las Vegas',
    state_province: 'NV',
    country: 'USA',
    country_code: 'US',
    postal_code: '89154',
    latitude: 36.1073,
    longitude: -115.1422,
    location_type: 'venue',
    is_verified: true,
  },
  computed_start_date: '2026-04-26T17:00:00.000Z',
  computed_end_date: '2026-04-27T01:00:00.000Z',
  status: 'published',
  visibility: 'public',
};

describe('buildEventJsonLd', () => {
  it('builds schema.org Event JSON-LD for a public in-person event', () => {
    const result = buildEventJsonLd(baseEvent);

    expect(result).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'TabConf Vegas',
      description: 'Hello world',
      url: 'https://app.evento.so/e/evt_123',
      startDate: '2026-04-26T17:00:00.000Z',
      endDate: '2026-04-27T01:00:00.000Z',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      organizer: {
        '@type': 'Organization',
        name: 'Evento',
        url: 'https://app.evento.so',
      },
      location: {
        '@type': 'Place',
        name: 'UNLV',
        address: 'UNLV, 4505 S Maryland Pkwy, Las Vegas, NV, 89154, USA',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 36.1073,
          longitude: -115.1422,
        },
      },
    });

    expect(result.image).toEqual(['https://app.evento.so/e/evt_123/social-image']);
  });

  it('falls back to online attendance mode when there is no location', () => {
    const result = buildEventJsonLd({
      ...baseEvent,
      location: '',
      event_locations: null,
    });

    expect(result.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(result.location).toBeUndefined();
  });

  it('maps cancelled events to EventCancelled', () => {
    const result = buildEventJsonLd({
      ...baseEvent,
      status: 'cancelled',
    });

    expect(result.eventStatus).toBe('https://schema.org/EventCancelled');
  });
});

describe('serializeJsonLd', () => {
  it('escapes less-than characters for safe inline script output', () => {
    const serialized = serializeJsonLd({ description: '<script>alert(1)</script>' });

    expect(serialized).toContain('\\u003cscript>alert(1)\\u003c/script>');
  });
});
