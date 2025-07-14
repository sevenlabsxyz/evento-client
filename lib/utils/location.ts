import { LocationData } from '@/components/create-event/location-modal';
import { EventLocation } from '@/lib/types/event';

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
    coordinates: locationData.coordinates
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
    formatted: formatEventLocationAddress(eventLocation)
  };
}

/**
 * Formats an EventLocation into a display-friendly address string
 */
export function formatEventLocationAddress(location: EventLocation): string {
  const parts = [
    location.name,
    location.address,
    location.city,
    location.state,
    location.zipCode,
    location.country
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ');
}

/**
 * Formats a LocationData into a display-friendly address string
 */
export function formatLocationDataAddress(location: LocationData): string {
  return location.formatted || formatEventLocationAddress({
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    country: location.country,
    zipCode: location.zipCode,
    coordinates: location.coordinates
  });
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
    formatted: addressString
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
  if (location.name && location.name !== location.address) {
    return location.name;
  }
  
  if (location.city) {
    return location.city;
  }
  
  return location.formatted.split(',')[0] || 'Unknown Location';
}