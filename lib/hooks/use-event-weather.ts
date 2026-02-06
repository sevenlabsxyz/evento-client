import { weatherService } from '@/lib/services/weather';
import { WeatherData, WeatherError, WeatherHookResult } from '@/lib/types/weather';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useState } from 'react';

interface UseEventWeatherProps {
  location: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  eventDate: string; // ISO string
  enabled?: boolean; // Allow disabling the hook
}

export function useEventWeather({
  location,
  eventDate,
  enabled = true,
}: UseEventWeatherProps): WeatherHookResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);

  const fetchWeather = useCallback(async () => {
    if (!enabled || !location.city || !location.country || !eventDate) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const date = new Date(eventDate);

      // Validate the date
      if (isNaN(date.getTime())) {
        setError('invalid_date');
        return;
      }

      const weatherData = await weatherService.getWeatherForEvent(
        {
          lat: location.coordinates?.lat,
          lon: location.coordinates?.lng,
          city: location.city,
          country: location.country,
        },
        date,
        'F' // Default to Fahrenheit, could be made configurable
      );

      setWeather(weatherData);
    } catch (err) {
      logger.warn('Weather fetch error', {
        error: err instanceof Error ? err.message : String(err),
      });

      // Map error types
      if (err instanceof Error) {
        switch (err.message) {
          case 'api_key_missing':
            setError('api_key_missing');
            break;
          case 'location_not_found':
            setError('location_not_found');
            break;
          case 'api_limit_exceeded':
            setError('api_limit_exceeded');
            break;
          case 'network_error':
            setError('network_error');
            break;
          case 'invalid_date':
            setError('invalid_date');
            break;
          default:
            setError('unknown_error');
        }
      } else {
        setError('unknown_error');
      }

      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, [
    location.city,
    location.country,
    location.coordinates?.lat,
    location.coordinates?.lng,
    eventDate,
    enabled,
  ]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Provide a retry function for error handling
  const retry = useCallback(() => {
    fetchWeather();
  }, [fetchWeather]);

  return {
    weather,
    loading,
    error,
    retry,
  } as WeatherHookResult & { retry: () => void };
}

export default useEventWeather;
