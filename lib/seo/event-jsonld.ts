import type { Event as ApiEvent } from '@/lib/types/api';
import { getAppUrl } from '@/lib/utils/app-url';
import { formatEventLocationAddress } from '@/lib/utils/location';

export type EventSeoRecord = Pick<
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

function getNumericCoordinate(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

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
    const latitude = getNumericCoordinate(eventLocation.latitude);
    const longitude = getNumericCoordinate(eventLocation.longitude);
    const coordinates =
      latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : undefined;

    const formattedAddress = formatEventLocationAddress({
      name: eventLocation.name || '',
      address: eventLocation.address || '',
      city: eventLocation.city || '',
      state: eventLocation.state_province || '',
      country: eventLocation.country || '',
      zipCode: eventLocation.postal_code || '',
      coordinates,
    });

    return {
      '@type': 'Place',
      name: eventLocation.name || event.title,
      address: formattedAddress || event.location || undefined,
      ...(coordinates
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude,
              longitude,
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
  const appUrl = getAppUrl();
  const url = `${appUrl}/e/${event.id}`;
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
      url: appUrl,
    },
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
