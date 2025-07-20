import { ApiEvent } from '@/lib/schemas/event';
import { debugLog } from './debug';

/**
 * Transform API response to ensure it has the expected format
 * Handles both new format (individual date fields) and legacy format (date/time strings)
 */
export function transformApiEventResponse(response: any): ApiEvent | null {
  if (!response) return null;

  // Check if we have the new format with individual date fields
  if ('start_date_day' in response && 'start_date_month' in response) {
    return response as ApiEvent;
  }

  // Check if we have legacy format with date/time fields
  if ('date' in response || 'time' in response) {

    try {
      // Parse the date string (assuming format like "2024-01-15")
      const startDateParts = response.date?.split('-');
      const endDateParts = (response.end_date || response.date)?.split('-');

      // Parse the time string (assuming format like "14:30" or "2:30 PM")
      const parseTime = (timeStr: string) => {
        if (!timeStr) return { hours: null, minutes: null };

        // Handle 24-hour format
        if (timeStr.includes(':') && !timeStr.includes(' ')) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return { hours, minutes };
        }

        // Handle 12-hour format
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const period = match[3].toUpperCase();

          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          return { hours, minutes };
        }

        return { hours: null, minutes: null };
      };

      const startTimeParsed = parseTime(response.time || '');
      const endTimeParsed = parseTime(response.end_time || response.time || '');

      const transformed = {
        ...response,
        start_date_day: startDateParts ? parseInt(startDateParts[2]) : 1,
        start_date_month: startDateParts ? parseInt(startDateParts[1]) : 1,
        start_date_year: startDateParts ? parseInt(startDateParts[0]) : new Date().getFullYear(),
        start_date_hours: startTimeParsed.hours,
        start_date_minutes: startTimeParsed.minutes,
        end_date_day: endDateParts
          ? parseInt(endDateParts[2])
          : startDateParts
            ? parseInt(startDateParts[2])
            : 1,
        end_date_month: endDateParts
          ? parseInt(endDateParts[1])
          : startDateParts
            ? parseInt(startDateParts[1])
            : 1,
        end_date_year: endDateParts
          ? parseInt(endDateParts[0])
          : startDateParts
            ? parseInt(startDateParts[0])
            : new Date().getFullYear(),
        end_date_hours: endTimeParsed.hours,
        end_date_minutes: endTimeParsed.minutes,
      };

      return transformed as ApiEvent;
    } catch (error) {
      return null;
    }
  }

  // If neither format is found, return as-is and let validation handle it
  return response as ApiEvent;
}
