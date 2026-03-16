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
  // Strip city/state/zip/country from the address field when it contains the
  // full formatted address (e.g. "2070 Park Centre Dr, Las Vegas, NV 89135, USA")
  // to avoid duplication with the structured fields.
  let streetAddress = (location.address ?? '').trim();
  if (streetAddress && location.city?.trim()) {
    const cityIdx = streetAddress
      .toLowerCase()
      .indexOf(', ' + location.city.trim().toLowerCase());
    if (cityIdx > 0) {
      streetAddress = streetAddress.slice(0, cityIdx).trim();
    }
  }

  // If the street address starts with the venue name, skip the name to avoid
  // duplication (e.g. name="Av. Nhandú, 848" address="Av. Nhandú, 848 - Planalto...").
  const name = (location.name ?? '').trim();
  const skipName =
    name && streetAddress && streetAddress.toLowerCase().startsWith(name.toLowerCase());

  const parts = [
    skipName ? '' : name,
    streetAddress,
    location.city,
    location.state,
    location.zipCode,
    location.country,
  ].filter((part) => part && part.trim() !== '');

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
  const fallbackLabel = options.fallbackLabel?.trim() || '';

  if (!options.preferStructuredAddress) {
    return {
      primary:
        fallbackLabel ||
        location.name.trim() ||
        location.address.trim() ||
        location.city.trim() ||
        location.country.trim() ||
        'TBD',
      secondary: '',
    };
  }

  // Strip city/state/zip/country from the address field so we only show the
  // street portion. The backend sometimes stores the full formatted address
  // (e.g. "2070 Park Centre Dr, Las Vegas, NV 89135, USA") in this field.
  let streetAddress = location.address.trim();
  if (streetAddress && location.city?.trim()) {
    const cityIdx = streetAddress.toLowerCase().indexOf(', ' + location.city.trim().toLowerCase());
    if (cityIdx > 0) {
      streetAddress = streetAddress.slice(0, cityIdx).trim();
    }
  }

  const primary =
    streetAddress ||
    location.name.trim() ||
    location.city.trim() ||
    location.country.trim() ||
    'TBD';

  const secondaryParts = [location.city.trim()];
  const region = location.state?.trim() || location.country.trim();

  if (region && region !== secondaryParts[0]) {
    secondaryParts.push(region);
  }

  return {
    primary,
    secondary: secondaryParts.filter(Boolean).join(', '),
  };
}
