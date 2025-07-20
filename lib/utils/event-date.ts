/**
 * Utilities for converting between UI date/time formats and API format
 */

export interface TimeFormat {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

export interface ApiDateFormat {
  day: number;
  month: number;
  year: number;
  hours: number | null;
  minutes: number | null;
}

/**
 * Convert a Date object to API format (individual fields)
 */
export function dateToApiFormat(date: Date): Omit<ApiDateFormat, 'hours' | 'minutes'> {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1, // JavaScript months are 0-indexed
    year: date.getFullYear(),
  };
}

/**
 * Convert time from 12-hour format to 24-hour format for API
 */
export function timeToApiFormat(time: TimeFormat): {
  hours: number;
  minutes: number;
} {
  let hours = time.hour;

  // Convert to 24-hour format
  if (time.period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (time.period === 'AM' && hours === 12) {
    hours = 0;
  }

  return {
    hours,
    minutes: time.minute,
  };
}

/**
 * Convert a Date and Time to full API format
 */
export function dateTimeToApiFormat(date: Date, time: TimeFormat): ApiDateFormat {
  const dateFields = dateToApiFormat(date);
  const timeFields = timeToApiFormat(time);

  return {
    ...dateFields,
    hours: timeFields.hours,
    minutes: timeFields.minutes,
  };
}

/**
 * Convert API date fields back to a Date object
 */
export function apiToDate(day: number, month: number, year: number): Date {
  return new Date(year, month - 1, day); // Months are 0-indexed in JavaScript
}

/**
 * Convert API time fields to 12-hour format
 */
export function apiToTime(hours: number | null, minutes: number | null): TimeFormat {
  if (hours === null || minutes === null) {
    return { hour: 12, minute: 0, period: 'PM' };
  }

  let hour = hours;
  let period: 'AM' | 'PM' = 'AM';

  if (hours === 0) {
    hour = 12;
    period = 'AM';
  } else if (hours === 12) {
    period = 'PM';
  } else if (hours > 12) {
    hour = hours - 12;
    period = 'PM';
  }

  return {
    hour,
    minute: minutes,
    period,
  };
}

/**
 * Combine API date and time fields into a Date object
 */
export function apiToDateTime(
  day: number,
  month: number,
  year: number,
  hours: number | null,
  minutes: number | null
): Date {
  const date = new Date(year, month - 1, day);

  if (hours !== null && minutes !== null) {
    date.setHours(hours);
    date.setMinutes(minutes);
  }

  return date;
}

/**
 * Validate if end date/time is after start date/time
 */
export function isEndAfterStart(
  startDate: Date,
  startTime: TimeFormat,
  endDate: Date,
  endTime: TimeFormat
): boolean {
  const start = new Date(startDate);
  const startApiTime = timeToApiFormat(startTime);
  start.setHours(startApiTime.hours, startApiTime.minutes);

  const end = new Date(endDate);
  const endApiTime = timeToApiFormat(endTime);
  end.setHours(endApiTime.hours, endApiTime.minutes);

  return end > start;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(time: TimeFormat): string {
  return `${time.hour.toString().padStart(2, '0')}:${time.minute
    .toString()
    .padStart(2, '0')} ${time.period}`;
}

/**
 * Get default event dates and times for new event creation
 * Returns tomorrow's date with current time (rounded to 30min intervals) + 1 hour duration
 */
export function getDefaultEventDateTime(): {
  startDate: Date;
  endDate: Date;
  startTime: TimeFormat;
  endTime: TimeFormat;
} {
  const now = new Date();

  // Get tomorrow's date
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  // Round current time to nearest 30-minute interval
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const roundedMinute = currentMinute < 15 ? 0 : currentMinute < 45 ? 30 : 0;
  const adjustedHour = currentMinute >= 45 ? currentHour + 1 : currentHour;

  // Convert to 12-hour format for start time
  let startHour = adjustedHour;
  let startPeriod: 'AM' | 'PM' = 'AM';

  if (startHour === 0) {
    startHour = 12;
  } else if (startHour === 12) {
    startPeriod = 'PM';
  } else if (startHour > 12) {
    startHour = startHour - 12;
    startPeriod = 'PM';
  }

  // Calculate end time (1 hour later)
  let endHour24 = adjustedHour + 1;
  let endMinute = roundedMinute;

  // Handle day overflow (cap at 11:30 PM if it would go to next day)
  if (endHour24 >= 24) {
    endHour24 = 23;
    endMinute = 30;
  }

  // Convert end time to 12-hour format
  let endHour = endHour24;
  let endPeriod: 'AM' | 'PM' = 'AM';

  if (endHour === 0) {
    endHour = 12;
  } else if (endHour === 12) {
    endPeriod = 'PM';
  } else if (endHour > 12) {
    endHour = endHour - 12;
    endPeriod = 'PM';
  }

  return {
    startDate: tomorrow,
    endDate: tomorrow, // Same day
    startTime: {
      hour: startHour,
      minute: roundedMinute,
      period: startPeriod,
    },
    endTime: {
      hour: endHour,
      minute: endMinute,
      period: endPeriod,
    },
  };
}
