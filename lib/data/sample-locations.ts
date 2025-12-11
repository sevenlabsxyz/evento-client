export interface LocationData {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  formatted: string; // Full formatted address for display
}

// Mock Google Places API results - in real app this would come from actual API
export const sampleLocations: LocationData[] = [
  {
    name: 'Moscone Center',
    address: '747 Howard St',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    zipCode: '94103',
    coordinates: { lat: 37.7849, lng: -122.4021 },
    formatted: 'Moscone Center, 747 Howard St, San Francisco, CA 94103, United States',
  },
  {
    name: 'Golden Gate Park',
    address: 'Golden Gate Park',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    coordinates: { lat: 37.7694, lng: -122.4862 },
    formatted: 'Golden Gate Park, San Francisco, CA, United States',
  },
  {
    name: 'Union Square',
    address: 'Union Square',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    coordinates: { lat: 37.788, lng: -122.4075 },
    formatted: 'Union Square, San Francisco, CA, United States',
  },
  {
    name: 'Pier 39',
    address: 'Pier 39',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    coordinates: { lat: 37.8086, lng: -122.4098 },
    formatted: 'Pier 39, San Francisco, CA, United States',
  },
];
