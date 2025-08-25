import { Event as ApiEvent, UserDetails } from '@/lib/types/api';
import { Event as DisplayEvent, EventHost, EventLocation } from '@/lib/types/event';
import { formatEventDate } from '@/lib/utils/date';
import { getOptimizedCoverUrl } from '@/lib/utils/image';

/**
 * Transform API event data to display format
 */
export function transformApiEventToDisplay(
  apiEvent: ApiEvent,
  hosts: { user_details: UserDetails }[] = [],
  galleryItems: { url: string }[] = []
): DisplayEvent {
  const { date, time, timeWithTz } = formatEventDate(
    apiEvent.computed_start_date,
    apiEvent.timezone
  );
  const endDateTime = formatEventDate(apiEvent.computed_end_date, apiEvent.timezone);

  // Parse location string to structured format
  const location = parseLocationString(apiEvent.location);

  // Transform hosts
  const transformedHosts: EventHost[] = hosts.map((host) => ({
    id: host.user_details.id,
    name: host.user_details.name || host.user_details.username,
    username: host.user_details.username,
    avatar: getOptimizedCoverUrl(host.user_details.image || '', 'feed'),
    title: host.user_details.bio ? 'Host' : undefined,
    company: undefined,
  }));

  // Add creator as first host if not already included and we have user details
  if (apiEvent.user_details) {
    const creatorHost: EventHost = {
      id: apiEvent.creator_user_id,
      name: apiEvent.user_details.name || apiEvent.user_details.username || 'Unknown',
      username: apiEvent.user_details.username || 'unknown',
      avatar: getOptimizedCoverUrl(apiEvent.user_details.image || '', 'feed'),
      title: 'Creator',
      company: undefined,
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
    date: date,
    startTime: time,
    endTime: endDateTime.time,
    timezone: timeWithTz.split(' ').pop(), // Extract timezone abbreviation
    computedStartDate: apiEvent.computed_start_date,
    computedEndDate: apiEvent.computed_end_date,
    location: location,
    coverImages: apiEvent.cover ? [getOptimizedCoverUrl(apiEvent.cover, 'detail')] : [],
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
    type: 'social', // Default, API doesn't provide this
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
