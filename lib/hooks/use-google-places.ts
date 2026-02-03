'use client';

import { Env } from '@/lib/constants/env';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  formatted: string;
  // Raw Google Places data for backend
  googlePlaceData?: {
    place_id: string;
    name: string;
    formatted_address: string;
    address_components: google.maps.GeocoderAddressComponent[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
}

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface UseGooglePlacesReturn {
  predictions: PlacePrediction[];
  isLoading: boolean;
  error: string | null;
  searchPlaces: (query: string) => void;
  getPlaceDetails: (placeId: string) => Promise<LocationData | null>;
  getCurrentLocation: () => Promise<LocationData | null>;
  clearPredictions: () => void;
  isScriptLoaded: boolean;
}

// Global script loading state
let isScriptLoading = false;
let isScriptLoaded = false;
const scriptLoadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded) {
      resolve();
      return;
    }

    if (isScriptLoading) {
      scriptLoadCallbacks.push(() => resolve());
      return;
    }

    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      scriptLoadCallbacks.forEach((cb) => cb());
      scriptLoadCallbacks.length = 0;
      resolve();
    };

    script.onerror = () => {
      isScriptLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): Partial<LocationData> {
  const result: Partial<LocationData> = {};

  for (const component of components) {
    const types = component.types;

    if (types.includes('street_number')) {
      result.address = component.long_name;
    } else if (types.includes('route')) {
      result.address = result.address
        ? `${result.address} ${component.long_name}`
        : component.long_name;
    } else if (types.includes('locality') || types.includes('postal_town')) {
      result.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name;
    } else if (types.includes('country')) {
      result.country = component.long_name;
    } else if (types.includes('postal_code')) {
      result.zipCode = component.long_name;
    }
  }

  return result;
}

export function useGooglePlaces(): UseGooglePlacesReturn {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(isScriptLoaded);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps script on mount
  useEffect(() => {
    const apiKey = Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setScriptLoaded(true);
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // PlacesService requires a DOM element or map, using a hidden div
        const div = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(div);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const searchPlaces = useCallback(
    (query: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!query.trim()) {
        setPredictions([]);
        return;
      }

      if (!scriptLoaded || !autocompleteServiceRef.current) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Debounce the API call
      debounceTimerRef.current = setTimeout(() => {
        autocompleteServiceRef.current!.getPlacePredictions({ input: query }, (results, status) => {
          setIsLoading(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(
              results.map((result) => ({
                placeId: result.place_id,
                mainText: result.structured_formatting.main_text,
                secondaryText: result.structured_formatting.secondary_text || '',
                description: result.description,
              }))
            );
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPredictions([]);
          } else {
            setError('Failed to fetch places');
            setPredictions([]);
          }
        });
      }, 300);
    },
    [scriptLoaded]
  );

  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<LocationData | null> => {
      if (!scriptLoaded || !placesServiceRef.current) {
        return null;
      }

      return new Promise((resolve) => {
        placesServiceRef.current!.getDetails(
          {
            placeId,
            fields: ['place_id', 'name', 'formatted_address', 'address_components', 'geometry'],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const addressComponents = place.address_components
                ? parseAddressComponents(place.address_components)
                : {};

              const lat = place.geometry?.location?.lat();
              const lng = place.geometry?.location?.lng();

              const locationData: LocationData = {
                name: place.name || '',
                address: addressComponents.address || '',
                city: addressComponents.city || '',
                state: addressComponents.state,
                country: addressComponents.country || '',
                zipCode: addressComponents.zipCode,
                coordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
                formatted: place.formatted_address || '',
                // Include raw Google Places data for backend
                googlePlaceData: {
                  place_id: place.place_id || placeId,
                  name: place.name || '',
                  formatted_address: place.formatted_address || '',
                  address_components: place.address_components || [],
                  geometry: {
                    location: {
                      lat: lat || 0,
                      lng: lng || 0,
                    },
                  },
                },
              };

              resolve(locationData);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    [scriptLoaded]
  );

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use Google Geocoding to get address from coordinates
          const apiKey = Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            resolve({
              name: 'Current Location',
              address: '',
              city: '',
              country: '',
              coordinates: { lat: latitude, lng: longitude },
              formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            });
            return;
          }

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const result = data.results[0];
              const addressComponents = parseAddressComponents(result.address_components);

              resolve({
                name: addressComponents.address || 'Current Location',
                address: addressComponents.address || '',
                city: addressComponents.city || '',
                state: addressComponents.state,
                country: addressComponents.country || '',
                zipCode: addressComponents.zipCode,
                coordinates: { lat: latitude, lng: longitude },
                formatted: result.formatted_address,
              });
            } else {
              resolve({
                name: 'Current Location',
                address: '',
                city: '',
                country: '',
                coordinates: { lat: latitude, lng: longitude },
                formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              });
            }
          } catch {
            resolve({
              name: 'Current Location',
              address: '',
              city: '',
              country: '',
              coordinates: { lat: latitude, lng: longitude },
              formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            });
          }
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError('Location permission denied');
              break;
            case err.POSITION_UNAVAILABLE:
              setError('Location information unavailable');
              break;
            case err.TIMEOUT:
              setError('Location request timed out');
              break;
            default:
              setError('Failed to get location');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    searchPlaces,
    getPlaceDetails,
    getCurrentLocation,
    clearPredictions,
    isScriptLoaded: scriptLoaded,
  };
}
