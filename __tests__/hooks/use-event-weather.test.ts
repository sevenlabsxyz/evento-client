import { useEventWeather } from '@/lib/hooks/use-event-weather';
import { weatherService } from '@/lib/services/weather';
import { WeatherData, WeatherHookResult } from '@/lib/types/weather';
import { act, renderHook, waitFor } from '@testing-library/react';

// Extend the WeatherHookResult type to include the retry function
type WeatherHookResultWithRetry = WeatherHookResult & { retry: () => void };

// Mock the weather service
jest.mock('@/lib/services/weather', () => ({
  weatherService: {
    getWeatherForEvent: jest.fn(),
  },
}));

const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => {});

describe('useEventWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  const createMockWeatherData = (
    overrides: Partial<WeatherData> = {}
  ): WeatherData => ({
    temperature: 72,
    unit: 'F',
    condition: 'Clear',
    description: 'clear sky',
    icon: '01d',
    humidity: 65,
    windSpeed: 5.2,
    feelsLike: 75,
    ...overrides,
  });

  const createMockLocation = (overrides: any = {}) => ({
    city: 'New York',
    country: 'US',
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
    ...overrides,
  });

  const createMockProps = (overrides: any = {}) => ({
    location: createMockLocation(),
    eventDate: '2024-06-15T14:00:00Z',
    enabled: true,
    ...overrides,
  });

  describe('basic functionality', () => {
    it('fetches weather data successfully', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toEqual(mockWeather);
      expect(result.current.error).toBeNull();
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        {
          lat: props.location.coordinates?.lat,
          lon: props.location.coordinates?.lng,
          city: props.location.city,
          country: props.location.country,
        },
        new Date(props.eventDate),
        'F'
      );
    });

    it('handles null weather response', async () => {
      mockWeatherService.getWeatherForEvent.mockResolvedValue(null);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('provides retry function', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof (result.current as WeatherHookResultWithRetry).retry).toBe(
        'function'
      );
    });
  });

  describe('loading state', () => {
    it('starts with loading true', () => {
      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      expect(result.current.loading).toBe(true);
    });

    it('sets loading to false after successful fetch', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets loading to false after error', async () => {
      const error = new Error('api_key_missing');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles api_key_missing error', async () => {
      const error = new Error('api_key_missing');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('api_key_missing');
      expect(result.current.weather).toBeNull();
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Weather fetch error:',
        error
      );
    });

    it('handles location_not_found error', async () => {
      const error = new Error('location_not_found');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('location_not_found');
      expect(result.current.weather).toBeNull();
    });

    it('handles api_limit_exceeded error', async () => {
      const error = new Error('api_limit_exceeded');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('api_limit_exceeded');
      expect(result.current.weather).toBeNull();
    });

    it('handles network_error error', async () => {
      const error = new Error('network_error');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('network_error');
      expect(result.current.weather).toBeNull();
    });

    it('handles invalid_date error', async () => {
      const error = new Error('invalid_date');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('invalid_date');
      expect(result.current.weather).toBeNull();
    });

    it('handles unknown error', async () => {
      const error = new Error('some_unknown_error');
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('unknown_error');
      expect(result.current.weather).toBeNull();
    });

    it('handles non-Error objects', async () => {
      const error = 'string error';
      mockWeatherService.getWeatherForEvent.mockRejectedValue(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('unknown_error');
      expect(result.current.weather).toBeNull();
    });
  });

  describe('date validation', () => {
    it('handles invalid date string', async () => {
      const props = createMockProps({
        eventDate: 'invalid-date',
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('invalid_date');
      expect(result.current.weather).toBeNull();
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();
    });

    it('handles valid date string', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        eventDate: '2024-12-25T10:00:00Z',
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        expect.any(Object),
        new Date('2024-12-25T10:00:00Z'),
        'F'
      );
    });
  });

  describe('disabled state', () => {
    it('does not fetch when enabled is false', () => {
      const props = createMockProps({
        enabled: false,
      });
      const { result } = renderHook(() => useEventWeather(props));

      expect(result.current.loading).toBe(false);
      expect(result.current.weather).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();
    });

    it('does not fetch when city is missing', () => {
      const props = createMockProps({
        location: createMockLocation({ city: '' }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      expect(result.current.loading).toBe(false);
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();
    });

    it('does not fetch when country is missing', () => {
      const props = createMockProps({
        location: createMockLocation({ country: '' }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      expect(result.current.loading).toBe(false);
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();
    });

    it('does not fetch when eventDate is missing', () => {
      const props = createMockProps({
        eventDate: '',
      });
      const { result } = renderHook(() => useEventWeather(props));

      expect(result.current.loading).toBe(false);
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();
    });
  });

  describe('location handling', () => {
    it('uses provided coordinates when available', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        location: createMockLocation({
          coordinates: {
            lat: 51.5074,
            lng: -0.1278,
          },
        }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        {
          lat: 51.5074,
          lon: -0.1278,
          city: 'New York',
          country: 'US',
        },
        expect.any(Date),
        'F'
      );
    });

    it('handles missing coordinates', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        location: createMockLocation({
          coordinates: undefined,
        }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        {
          lat: undefined,
          lon: undefined,
          city: 'New York',
          country: 'US',
        },
        expect.any(Date),
        'F'
      );
    });

    it('handles partial coordinates', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        location: createMockLocation({
          coordinates: {
            lat: 40.7128,
            lng: undefined,
          },
        }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        {
          lat: 40.7128,
          lon: undefined,
          city: 'New York',
          country: 'US',
        },
        expect.any(Date),
        'F'
      );
    });
  });

  describe('retry functionality', () => {
    it('retry function refetches weather data', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toBeNull();

      // Call retry
      act(() => {
        (result.current as WeatherHookResultWithRetry).retry();
      });

      // Wait for retry to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toEqual(mockWeather);
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledTimes(2);
    });

    it('retry function handles errors', async () => {
      const error = new Error('network_error');
      mockWeatherService.getWeatherForEvent
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(error);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call retry
      act(() => {
        (result.current as WeatherHookResultWithRetry).retry();
      });

      // Wait for retry to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('network_error');
      expect(result.current.weather).toBeNull();
    });
  });

  describe('dependency changes', () => {
    it('refetches when location changes', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result, rerender } = renderHook(
        ({ location }) => useEventWeather({ ...props, location }),
        {
          initialProps: { location: props.location },
        }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change location
      const newLocation = createMockLocation({
        city: 'London',
        country: 'UK',
      });

      rerender({ location: newLocation });

      // Wait for refetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledTimes(2);
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenLastCalledWith(
        {
          lat: newLocation.coordinates?.lat,
          lon: newLocation.coordinates?.lng,
          city: 'London',
          country: 'UK',
        },
        expect.any(Date),
        'F'
      );
    });

    it('refetches when eventDate changes', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result, rerender } = renderHook(
        ({ eventDate }) => useEventWeather({ ...props, eventDate }),
        {
          initialProps: { eventDate: props.eventDate },
        }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change eventDate
      const newEventDate = '2024-07-15T16:00:00Z';
      rerender({ eventDate: newEventDate });

      // Wait for refetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledTimes(2);
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenLastCalledWith(
        expect.any(Object),
        new Date(newEventDate),
        'F'
      );
    });

    it('refetches when enabled changes from false to true', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({ enabled: false });
      const { result, rerender } = renderHook(
        ({ enabled }) => useEventWeather({ ...props, enabled }),
        {
          initialProps: { enabled: false },
        }
      );

      // Should not fetch initially
      expect(mockWeatherService.getWeatherForEvent).not.toHaveBeenCalled();

      // Enable the hook
      rerender({ enabled: true });

      // Wait for fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('weather data structure', () => {
    it('handles complete weather data', async () => {
      const mockWeather = createMockWeatherData({
        temperature: 85,
        unit: 'F',
        condition: 'Clouds',
        description: 'few clouds',
        icon: '02d',
        humidity: 70,
        windSpeed: 8.5,
        feelsLike: 88,
      });

      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toEqual(mockWeather);
      expect(result.current.weather?.temperature).toBe(85);
      expect(result.current.weather?.unit).toBe('F');
      expect(result.current.weather?.condition).toBe('Clouds');
      expect(result.current.weather?.humidity).toBe(70);
      expect(result.current.weather?.windSpeed).toBe(8.5);
      expect(result.current.weather?.feelsLike).toBe(88);
    });

    it('handles minimal weather data', async () => {
      const mockWeather = createMockWeatherData({
        temperature: 20,
        unit: 'C',
        condition: 'Rain',
        description: 'light rain',
        icon: '10d',
        humidity: undefined,
        windSpeed: undefined,
        feelsLike: undefined,
      });

      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps();
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.weather).toEqual(mockWeather);
      expect(result.current.weather?.humidity).toBeUndefined();
      expect(result.current.weather?.windSpeed).toBeUndefined();
      expect(result.current.weather?.feelsLike).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('handles very far future date', async () => {
      const props = createMockProps({
        eventDate: '2030-12-25T10:00:00Z',
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // The service should be called, but may return null for dates too far in future
      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalled();
    });

    it('handles past date', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        eventDate: '2020-01-01T10:00:00Z',
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalled();
    });

    it('handles special characters in location', async () => {
      const mockWeather = createMockWeatherData();
      mockWeatherService.getWeatherForEvent.mockResolvedValue(mockWeather);

      const props = createMockProps({
        location: createMockLocation({
          city: 'São Paulo',
          country: 'Brasil',
        }),
      });
      const { result } = renderHook(() => useEventWeather(props));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockWeatherService.getWeatherForEvent).toHaveBeenCalledWith(
        {
          lat: expect.any(Number),
          lon: expect.any(Number),
          city: 'São Paulo',
          country: 'Brasil',
        },
        expect.any(Date),
        'F'
      );
    });
  });
});
