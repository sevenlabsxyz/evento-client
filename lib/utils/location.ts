import { LocationData } from '@/lib/hooks/use-google-places';
import { EventLocation } from '@/lib/types/event';

export interface EventLocationDisplayLines {
  primary: string;
  secondary: string;
}

interface EventLocationDisplayOptions {
  preferStructuredAddress?: boolean;
  fallbackLabel?: string;
}

type LocationTextFields = {
  name: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  address: string;
};

const COUNTRY_ALIASES: Record<string, string[]> = {
  usa: ['united states', 'united states of america'],
  'united states': ['usa', 'united states of america'],
  'united states of america': ['usa', 'united states'],
  uk: ['united kingdom', 'great britain'],
  'united kingdom': ['uk', 'great britain'],
  canada: ['ca'],
};

function getSafeLocationField(value?: string): string {
  return value?.trim() || '';
}

function getLocationTextFields(location: EventLocation): LocationTextFields {
  return {
    name: getSafeLocationField(location.name),
    city: getSafeLocationField(location.city),
    state: getSafeLocationField(location.state),
    country: getSafeLocationField(location.country),
    zipCode: getSafeLocationField(location.zipCode),
    address: getSafeLocationField(location.address),
  };
}

function normalizeLocationToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLocationCode(value: string): string {
  return normalizeLocationToken(value).replace(/[^a-z0-9]/g, '');
}

function isCountrySuffixSegment(addressSegment: string, country: string): boolean {
  if (!country) return false;

  const normalizedAddressSegment = normalizeLocationToken(addressSegment);
  const normalizedCountry = normalizeLocationToken(country);
  if (!normalizedAddressSegment || !normalizedCountry) {
    return false;
  }

  if (normalizedAddressSegment === normalizedCountry) {
    return true;
  }

  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    const normalizedCanonical = normalizeLocationToken(canonical);
    const normalizedAliases = aliases.map((alias) => normalizeLocationToken(alias));
    if (
      normalizedCanonical === normalizedCountry ||
      normalizedAliases.includes(normalizedCountry)
    ) {
      if (
        normalizedAliases.includes(normalizedAddressSegment) ||
        normalizedCanonical === normalizedAddressSegment
      ) {
        return true;
      }
    }
  }

  return false;
}

function isZipSuffixSegment(addressSegment: string, zipCode?: string): boolean {
  if (!zipCode) return false;
  const normalizedAddressSegment = normalizeLocationCode(addressSegment);
  const normalizedZipCode = normalizeLocationCode(zipCode);

  if (!normalizedAddressSegment || !normalizedZipCode) return false;

  return normalizedAddressSegment.includes(normalizedZipCode);
}

function isStateSuffixSegment(addressSegment: string, state?: string): boolean {
  if (!state) return false;

  const normalizedAddressSegment = normalizeLocationToken(addressSegment);
  const normalizedState = normalizeLocationToken(state);

  if (!normalizedAddressSegment || !normalizedState) {
    return false;
  }

  if (normalizedAddressSegment === normalizedState) {
    return true;
  }

  return normalizedAddressSegment.startsWith(`${normalizedState} `);
}

function isCitySuffixSegment(addressSegment: string, city?: string): boolean {
  if (!city) return false;

  const normalizedAddressSegment = normalizeLocationToken(addressSegment);
  const normalizedCity = normalizeLocationToken(city);

  if (!normalizedAddressSegment || !normalizedCity) {
    return false;
  }

  if (normalizedAddressSegment === normalizedCity) return true;

  return normalizedAddressSegment.split('-')[0]?.trim() === normalizedCity;
}

function stripLocationSuffixFromAddress(
  address: string,
  location: Pick<EventLocation, 'city' | 'state' | 'country' | 'zipCode'>
): string {
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    return '';
  }

  const segments = trimmedAddress
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment !== '');

  if (segments.length <= 1) {
    return trimmedAddress;
  }

  let suffixIndex = segments.length - 1;
  let foundSuffix = false;

  if (isCountrySuffixSegment(segments[suffixIndex], location.country)) {
    suffixIndex -= 1;
    foundSuffix = true;
  }

  while (suffixIndex > 0) {
    const segment = segments[suffixIndex];
    const isZipMatch = isZipSuffixSegment(segment, location.zipCode);
    const isStateMatch = isStateSuffixSegment(segment, location.state);
    if (!isZipMatch && !isStateMatch) {
      break;
    }

    suffixIndex -= 1;
    foundSuffix = true;
  }

  const cityIndex = segments.findIndex(
    (segment, index) =>
      index > 0 && index <= suffixIndex && isCitySuffixSegment(segment, location.city)
  );

  if (!foundSuffix && cityIndex === -1) {
    return trimmedAddress;
  }

  // If we found the city with data after it, assume it's a full backend-formatted suffix.
  if (cityIndex > 0 && cityIndex < segments.length - 1) {
    return segments.slice(0, cityIndex).join(', ');
  }

  return trimmedAddress;
}

/**
 * Converts LocationData from the modal to EventLocation format used in the Event interface
 */
export function locationDataToEventLocation(locationData: LocationData): EventLocation {
  return {
    name: locationData.name,
    address: locationData.address,
    city: locationData.city,
    state: locationData.state,
    country: locationData.country,
    zipCode: locationData.zipCode,
    coordinates: locationData.coordinates,
  };
}

/**
 * Converts EventLocation to LocationData format for the modal
 */
export function eventLocationToLocationData(eventLocation: EventLocation): LocationData {
  return {
    name: eventLocation.name,
    address: eventLocation.address,
    city: eventLocation.city,
    state: eventLocation.state,
    country: eventLocation.country,
    zipCode: eventLocation.zipCode,
    coordinates: eventLocation.coordinates,
    formatted: formatEventLocationAddress(eventLocation),
  };
}

/**
 * Formats an EventLocation into a display-friendly address string
 */
export function formatEventLocationAddress(location: EventLocation): string {
  const { name, city, state, country, zipCode, address } = getLocationTextFields(location);

  let streetAddress = stripLocationSuffixFromAddress(address, {
    city,
    state,
    country,
    zipCode,
  });

  // If the street address starts with the venue name, skip the name to avoid
  // duplication (e.g. name="Av. Nhandú, 848" address="Av. Nhandú, 848 - Planalto...").
  const skipName =
    name && streetAddress && streetAddress.toLowerCase().startsWith(name.toLowerCase());

  const parts = [skipName ? '' : name, streetAddress, city, state, zipCode, country].filter(
    (part) => part && part.trim() !== ''
  );

  return parts.join(', ');
}

/**
 * Formats a LocationData into a display-friendly address string
 */
export function formatLocationDataAddress(location: LocationData): string {
  return (
    location.formatted ||
    formatEventLocationAddress({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      zipCode: location.zipCode,
      coordinates: location.coordinates,
    })
  );
}

/**
 * Parses a location string from the API into LocationData
 * Handles formats like "Moscone Center, 747 Howard St, San Francisco, CA 94103, United States"
 */
export function parseLocationString(locationStr: string): LocationData {
  if (!locationStr) {
    return {
      name: '',
      address: '',
      city: '',
      country: '',
      formatted: '',
    };
  }

  const parts = locationStr.split(',').map((s) => s.trim());

  if (parts.length === 1) {
    // Simple location like "Online" or just a city name
    return {
      name: parts[0],
      address: '',
      city: parts[0],
      country: '',
      formatted: locationStr,
    };
  }

  if (parts.length >= 5) {
    // Full format: "Name, Address, City, State ZIP, Country"
    const stateZip = parts[3];
    const stateMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})$/);

    return {
      name: parts[0],
      address: parts[1],
      city: parts[2],
      state: stateMatch ? stateMatch[1] : parts[3],
      zipCode: stateMatch ? stateMatch[2] : undefined,
      country: parts[4],
      formatted: locationStr,
    };
  }

  // Fallback for other formats
  return {
    name: parts[0] || '',
    address: parts[1] || '',
    city: parts[2] || parts[0],
    state: parts[3],
    country: parts[parts.length - 1],
    formatted: locationStr,
  };
}

/**
 * Parses a simple address string into basic LocationData
 * Used for backward compatibility with existing text-based address inputs
 */
export function parseAddressString(addressString: string): LocationData {
  // For simple parsing, we'll treat the whole string as the name/address
  // In a real app, you might use more sophisticated parsing or geocoding
  return {
    name: addressString,
    address: addressString,
    city: '',
    country: '',
    formatted: addressString,
  };
}

/**
 * Checks if a location is valid (has required fields)
 */
export function isValidLocation(location: LocationData): boolean {
  return !!(location.name || location.address) && location.formatted.trim() !== '';
}

/**
 * Gets a short display name for a location (for buttons, etc.)
 */
export function getLocationDisplayName(location: LocationData): string {
  if (location.formatted && location.formatted.trim()) {
    return location.formatted;
  }

  if (location.name && location.name !== location.address) {
    return location.name;
  }

  if (location.city) {
    return location.city;
  }

  return location.formatted.split(',')[0] || 'Unknown Location';
}

export function getEventLocationDisplayLines(
  location: EventLocation,
  options: EventLocationDisplayOptions = {}
): EventLocationDisplayLines {
  const { name, city, state, country, zipCode, address } = getLocationTextFields(location);

  const fallbackLabel = options.fallbackLabel?.trim() || '';

  if (!options.preferStructuredAddress) {
    return {
      primary: fallbackLabel || name || address || city || country || 'TBD',
      secondary: '',
    };
  }

  // Strip city/state/zip/country from the address field so we only show the
  // street portion. The backend sometimes stores the full formatted address
  // (e.g. "2070 Park Centre Dr, Las Vegas, NV 89135, USA") in this field.
  const streetAddress = stripLocationSuffixFromAddress(address, {
    city,
    state,
    country,
    zipCode,
  });

  const primary = streetAddress || name || city || country || 'TBD';

  const secondaryParts = [city];
  const region = state || country;

  if (region && region !== secondaryParts[0]) {
    secondaryParts.push(region);
  }

  return {
    primary,
    secondary: secondaryParts.filter(Boolean).join(', '),
  };
}
