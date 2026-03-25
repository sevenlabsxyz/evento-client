import type { Event as ApiEvent } from '@/lib/types/api';
import { formatEventLocationAddress } from '@/lib/utils/location';

const APP_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3003' : 'https://app.evento.so';

type EventSeoRecord = Pick<
  ApiEvent,
  | 'id'
  | 'title'
  | 'description'
  | 'location'
  | 'event_locations'
  | 'computed_start_date'
  | 'computed_end_date'
  | 'status'
  | 'visibility'
>;

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDescription(description: string | null | undefined): string | undefined {
  if (!description) return undefined;

  const cleanDescription = stripHtml(description);
  if (!cleanDescription) return undefined;

  return cleanDescription;
}

function getLocation(event: EventSeoRecord) {
  const eventLocation = event.event_locations;

  if (eventLocation) {
    const formattedAddress = formatEventLocationAddress({
      name: eventLocation.name || '',
      address: eventLocation.address || '',
      city: eventLocation.city || '',
      state: eventLocation.state_province || '',
      country: eventLocation.country || '',
      zipCode: eventLocation.postal_code || '',
      coordinates:
        eventLocation.latitude !== null && eventLocation.longitude !== null
          ? { lat: eventLocation.latitude, lng: eventLocation.longitude }
          : undefined,
    });

    return {
      '@type': 'Place',
      name: eventLocation.name || event.title,
      address: formattedAddress || event.location || undefined,
      ...(eventLocation.latitude !== null && eventLocation.longitude !== null
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: eventLocation.latitude,
              longitude: eventLocation.longitude,
            },
          }
        : {}),
    };
  }

  if (event.location?.trim()) {
    return {
      '@type': 'Place',
      name: event.location.trim(),
      address: event.location.trim(),
    };
  }

  return undefined;
}

function getEventStatus(status: string | null | undefined): string {
  if (status === 'cancelled') {
    return 'https://schema.org/EventCancelled';
  }

  if (status === 'archived') {
    return 'https://schema.org/EventPostponed';
  }

  return 'https://schema.org/EventScheduled';
}

export function buildEventJsonLd(event: EventSeoRecord) {
  const url = `${APP_URL}/e/${event.id}`;
  const image = `${url}/social-image`;
  const description = getDescription(event.description);
  const location = getLocation(event);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    ...(description ? { description } : {}),
    url,
    image: [image],
    startDate: event.computed_start_date,
    endDate: event.computed_end_date,
    eventStatus: getEventStatus(event.status),
    eventAttendanceMode: location
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    ...(location ? { location } : {}),
    organizer: {
      '@type': 'Organization',
      name: 'Evento',
      url: APP_URL,
    },
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
