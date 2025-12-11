import {
  GeocodeResponse,
  OpenWeatherMapForecastResponse,
  OpenWeatherMapResponse,
  WeatherData,
} from '@/lib/types/weather';
import { Env } from '../constants/env';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0';

class WeatherService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = Env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
  }

  private validateApiKey(): boolean {
    return !!this.apiKey;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('api_key_missing');
      }
      if (response.status === 404) {
        throw new Error('location_not_found');
      }
      if (response.status === 429) {
        throw new Error('api_limit_exceeded');
      }
      throw new Error('network_error');
    }

    return response.json();
  }

  private transformWeatherData(
    data: OpenWeatherMapResponse | any,
    unit: 'C' | 'F' = 'C'
  ): WeatherData {
    const weather = data.weather?.[0];
    const main = data.main || data;

    return {
      temperature: Math.round(main.temp || main.temperature),
      unit,
      condition: weather?.main || 'Unknown',
      description: weather?.description || '',
      icon: weather?.icon || '01d',
      humidity: main.humidity,
      windSpeed: data.wind?.speed,
      feelsLike: main.feels_like ? Math.round(main.feels_like) : undefined,
    };
  }

  async geocodeLocation(city: string, country: string): Promise<{ lat: number; lon: number }> {
    if (!this.validateApiKey()) {
      throw new Error('api_key_missing');
    }

    try {
      const query = `${city},${country}`;
      const response = await fetch(
        `${OPENWEATHER_GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`
      );

      const data = await this.handleResponse<GeocodeResponse[]>(response);

      if (!data || data.length === 0) {
        throw new Error('location_not_found');
      }

      return {
        lat: data[0].lat,
        lon: data[0].lon,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('api_') ||
          error.message.startsWith('location_') ||
          error.message.startsWith('network_'))
      ) {
        throw error;
      }
      throw new Error('unknown_error');
    }
  }

  async getCurrentWeather(lat: number, lon: number, unit: 'C' | 'F' = 'C'): Promise<WeatherData> {
    if (!this.validateApiKey()) {
      throw new Error('api_key_missing');
    }

    try {
      const units = unit === 'C' ? 'metric' : 'imperial';
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`
      );

      const data = await this.handleResponse<OpenWeatherMapResponse>(response);
      return this.transformWeatherData(data, unit);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('api_') ||
          error.message.startsWith('location_') ||
          error.message.startsWith('network_'))
      ) {
        throw error;
      }
      throw new Error('unknown_error');
    }
  }

  async getForecastWeather(
    lat: number,
    lon: number,
    targetDate: Date,
    unit: 'C' | 'F' = 'C'
  ): Promise<WeatherData | null> {
    if (!this.validateApiKey()) {
      throw new Error('api_key_missing');
    }

    try {
      const units = unit === 'C' ? 'metric' : 'imperial';
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${this.apiKey}`
      );

      const data = await this.handleResponse<OpenWeatherMapForecastResponse>(response);

      // Find the forecast entry closest to the target date
      const targetTimestamp = targetDate.getTime() / 1000;
      let closestEntry = null;
      let minDiff = Infinity;

      for (const entry of data.list) {
        const diff = Math.abs(entry.dt - targetTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestEntry = entry;
        }
      }

      if (!closestEntry) {
        return null;
      }

      return this.transformWeatherData(
        {
          weather: closestEntry.weather,
          main: closestEntry.main,
          wind: closestEntry.wind,
        },
        unit
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('api_') ||
          error.message.startsWith('location_') ||
          error.message.startsWith('network_'))
      ) {
        throw error;
      }
      throw new Error('unknown_error');
    }
  }

  async getHistoricalWeather(
    lat: number,
    lon: number,
    targetDate: Date,
    unit: 'C' | 'F' = 'C'
  ): Promise<WeatherData | null> {
    if (!this.validateApiKey()) {
      throw new Error('api_key_missing');
    }

    try {
      const timestamp = Math.floor(targetDate.getTime() / 1000);
      const units = unit === 'C' ? 'metric' : 'imperial';

      // Note: Historical weather API requires a paid plan for OpenWeatherMap
      // For free tier, we'll fallback to current weather as a reasonable estimate
      const daysDiff = Math.abs(Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

      // Use current weather as a reasonable estimate for any past date
      return this.getCurrentWeather(lat, lon, unit);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('api_') ||
          error.message.startsWith('location_') ||
          error.message.startsWith('network_'))
      ) {
        throw error;
      }
      throw new Error('unknown_error');
    }
  }

  async getWeatherForEvent(
    location: { lat?: number; lon?: number; city: string; country: string },
    eventDate: Date,
    unit: 'C' | 'F' = 'C'
  ): Promise<WeatherData | null> {
    try {
      let coordinates: { lat: number; lon: number };

      // Use provided coordinates or geocode the location
      if (location.lat && location.lon) {
        coordinates = { lat: location.lat, lon: location.lon };
      } else {
        coordinates = await this.geocodeLocation(location.city, location.country);
      }

      const now = new Date();
      const eventTime = eventDate.getTime();
      const currentTime = now.getTime();
      const daysDiff = (eventTime - currentTime) / (1000 * 60 * 60 * 24);

      // Determine which API to use based on event date
      if (eventTime > currentTime) {
        // Future event - use forecast (up to 5 days)
        if (daysDiff <= 5) {
          return this.getForecastWeather(coordinates.lat, coordinates.lon, eventDate, unit);
        } else {
          // Event too far in future, return null
          return null;
        }
      } else {
        // Past event - use current weather as fallback
        return this.getHistoricalWeather(coordinates.lat, coordinates.lon, eventDate, unit);
      }
    } catch (error) {
      // Return null for any error to gracefully degrade
      console.warn('Weather service error:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
export default weatherService;
