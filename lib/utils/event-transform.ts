import { Event as ApiEvent, UserDetails } from '@/lib/types/api';
import { EventDetail as DisplayEvent, EventHost, EventLocation } from '@/lib/types/event';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl, getOptimizedCoverUrl } from '@/lib/utils/image';
import { getTimezoneAbbreviationSync } from '@/lib/utils/timezone';

function normalizeDatePart(value: unknown, min: number, max: number): number | undefined {
  if (!Number.isInteger(value)) {
    return undefined;
  }

  const numericValue = value as number;
  if (numericValue < min || numericValue > max) {
    return undefined;
  }

  return numericValue;
}

/**
 * Transform API event data to display format
 */
export function transformApiEventToDisplay(
  apiEvent: ApiEvent,
  hosts: { user_details: UserDetails | null }[] = [],
  galleryItems: { url: string }[] = []
): DisplayEvent {
  const normalizedStartYear = normalizeDatePart(apiEvent.start_date_year, 1, 9999);
  const normalizedStartMonth = normalizeDatePart(apiEvent.start_date_month, 1, 12);
  const normalizedStartDay = normalizeDatePart(apiEvent.start_date_day, 1, 31);
  const normalizedStartHours = normalizeDatePart(apiEvent.start_date_hours, 0, 23);
  const normalizedStartMinutes = normalizeDatePart(apiEvent.start_date_minutes, 0, 59);

  const normalizedEndYear = normalizeDatePart(apiEvent.end_date_year, 1, 9999);
  const normalizedEndMonth = normalizeDatePart(apiEvent.end_date_month, 1, 12);
  const normalizedEndDay = normalizeDatePart(apiEvent.end_date_day, 1, 31);
  const normalizedEndHours = normalizeDatePart(apiEvent.end_date_hours, 0, 23);
  const normalizedEndMinutes = normalizeDatePart(apiEvent.end_date_minutes, 0, 59);

  const startDateTime = formatEventDateFromParts({
    year: normalizedStartYear,
    month: normalizedStartMonth,
    day: normalizedStartDay,
    hours: normalizedStartHours,
    minutes: normalizedStartMinutes,
    timezone: apiEvent.timezone,
    fallbackIso: apiEvent.computed_start_date,
  });
  const endDateTime = formatEventDateFromParts({
    year: normalizedEndYear,
    month: normalizedEndMonth,
    day: normalizedEndDay,
    hours: normalizedEndHours,
    minutes: normalizedEndMinutes,
    timezone: apiEvent.timezone,
    fallbackIso: apiEvent.computed_end_date,
  });

  // Get location from event_locations (new format) or parse legacy location string
  const eventLoc = apiEvent.event_locations;
  const location: EventLocation = eventLoc
    ? {
        name: eventLoc.name || '',
        address: eventLoc.address || '',
        city: eventLoc.city || '',
        state: eventLoc.state_province || '',
        country: eventLoc.country || '',
        coordinates:
          eventLoc.latitude !== null &&
          eventLoc.latitude !== undefined &&
          eventLoc.longitude !== null &&
          eventLoc.longitude !== undefined
            ? { lat: Number(eventLoc.latitude), lng: Number(eventLoc.longitude) }
            : undefined,
      }
    : parseLocationString(apiEvent.location || '');

  // Transform hosts
  const transformedHosts: EventHost[] = hosts.flatMap((host) => {
    if (!host.user_details) {
      return [];
    }

    return [
      {
        id: host.user_details.id,
        name: host.user_details.name || host.user_details.username,
        username: host.user_details.username,
        avatar: getOptimizedCoverUrl(host.user_details.image || '', 'feed'),
        title: host.user_details.bio ? 'Host' : undefined,
        company: undefined,
        verification_status: host.user_details.verification_status,
      },
    ];
  });

  // Add creator as first host if not already included and we have user details
  if (apiEvent.user_details) {
    const creatorHost: EventHost = {
      id: apiEvent.creator_user_id,
      name: apiEvent.user_details.name || apiEvent.user_details.username || 'Unknown',
      username: apiEvent.user_details.username || 'unknown',
      avatar: getOptimizedCoverUrl(apiEvent.user_details.image || '', 'feed'),
      title: 'Creator',
      company: undefined,
      verification_status: apiEvent.user_details.verification_status,
    };

    if (!transformedHosts.find((h) => h.id === creatorHost.id)) {
      transformedHosts.unshift(creatorHost);
    }
  }

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    subtitle:
      location.city && location.state ? `${location.city}, ${location.state}` : location.name,
    description: apiEvent.description || '',
    date: startDateTime.date,
    startTime: startDateTime.time,
    endTime: endDateTime.time,
    timezone: getTimezoneAbbreviationSync(apiEvent.timezone),
    computedStartDate: apiEvent.computed_start_date,
    computedEndDate: apiEvent.computed_end_date,
    monthShort: startDateTime.monthShort,
    dayOfMonth: startDateTime.dayOfMonth,
    longDate: startDateTime.longDate,
    location: location,
    coverImages: [getEventCoverDisplayUrl(apiEvent.cover, 'detail')],
    galleryImages: galleryItems.map((item) => getOptimizedCoverUrl(item.url, 'detail')),
    hosts: transformedHosts,
    guests: [], // Not provided by API currently
    guestListSettings: {
      isPublic: apiEvent.visibility === 'public',
      allowPublicRSVP: true, // Default, can be updated based on settings
    },
    perks: [], // Not in current API
    details: {
      profileUrl: apiEvent.contrib_cashapp || apiEvent.contrib_venmo || undefined,
      website: apiEvent.spotify_url || apiEvent.wavlake_url || undefined,
    },
    capacity: undefined, // Not in current API
    weather: undefined, // Not in current API
    category: 'social',
    tags: [], // Not in current API
    isActive: apiEvent.status === 'published',
    registrationUrl: undefined, // Not in current API
    contactEnabled: true, // Default
    owner: apiEvent.user_details
      ? {
          id: apiEvent.creator_user_id,
          name: apiEvent.user_details.name || apiEvent.user_details.username,
          username: apiEvent.user_details.username,
        }
      : undefined,
  };
}

/**
 * Parse location string into structured format
 * Attempts to extract city, state, country from comma-separated string
 */
function parseLocationString(locationStr: string): EventLocation {
  if (!locationStr) {
    return {
      name: 'TBD',
      address: '',
      city: '',
      country: '',
    };
  }

  const parts = locationStr.split(',').map((s) => s.trim());

  // Common patterns:
  // "Venue Name, Address, City, State, Country"
  // "City, State, Country"
  // "Venue Name, City"
  // "Online"

  if (parts.length === 1) {
    return {
      name: parts[0],
      address: '',
      city: parts[0],
      country: '',
    };
  }

  if (parts.length === 2) {
    return {
      name: parts[0],
      address: '',
      city: parts[0],
      state: parts[1],
      country: '',
    };
  }

  if (parts.length === 3) {
    return {
      name: parts[0],
      address: '',
      city: parts[1],
      state: parts[2],
      country: '',
    };
  }

  // 4 or more parts
  return {
    name: parts[0],
    address: parts[1],
    city: parts[parts.length - 3] || parts[1],
    state: parts[parts.length - 2],
    country: parts[parts.length - 1],
  };
}

/**
 * Get contribution methods from event
 */
export function getContributionMethods(event: ApiEvent) {
  const methods = [];

  if (event.contrib_cashapp) {
    methods.push({
      type: 'cashapp',
      value: event.contrib_cashapp,
      label: 'Cash App',
    });
  }

  if (event.contrib_venmo) {
    methods.push({
      type: 'venmo',
      value: event.contrib_venmo,
      label: 'Venmo',
    });
  }

  if (event.contrib_paypal) {
    methods.push({
      type: 'paypal',
      value: event.contrib_paypal,
      label: 'PayPal',
    });
  }

  if (event.contrib_btclightning) {
    methods.push({
      type: 'lightning',
      value: event.contrib_btclightning,
      label: 'Bitcoin Lightning',
    });
  }

  return methods;
}
