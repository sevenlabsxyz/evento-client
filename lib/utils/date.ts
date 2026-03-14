import { logger } from './logger';
import { getTimezoneAbbreviationSync } from './timezone';

interface EventDateDisplay {
  date: string;
  time: string;
  timeWithTz: string;
  dayOfWeek: string;
  shortDate: string;
  monthShort: string;
  dayOfMonth: string;
  longDate: string;
}

interface EventDatePartsInput {
  year?: number | null;
  month?: number | null;
  day?: number | null;
  hours?: number | null;
  minutes?: number | null;
  timezone?: string;
  fallbackIso?: string;
}

interface EventDateRangeInput {
  start: EventDatePartsInput;
  end: EventDatePartsInput;
}

interface EventDateRangeDisplay {
  startDate: EventDateDisplay;
  endDate: EventDateDisplay;
  displayDate: string;
  isMultiDay: boolean;
}

interface EventDateRangeParts {
  day: string;
  month: string;
  weekdayShort: string;
  year: string;
}

const EMPTY_EVENT_DATE_DISPLAY: EventDateDisplay = {
  date: '',
  time: '',
  timeWithTz: '',
  dayOfWeek: '',
  shortDate: '',
  monthShort: '',
  dayOfMonth: '',
  longDate: '',
};

const MIN_HOUR = 0;
const MAX_HOUR = 23;
const MIN_MINUTE = 0;
const MAX_MINUTE = 59;
const DATE_PARTS_CACHE_LIMIT = 200;
const datePartsDisplayCache = new Map<string, EventDateDisplay>();

function getIntlTimeZoneOptions(timezone?: string): Intl.DateTimeFormatOptions {
  if (!timezone) {
    return {};
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return { timeZone: timezone };
  } catch (error) {
    logger.warn('Invalid timezone provided for date formatting', {
      timezone,
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

/**
 * Format ISO date string to display format
 * @param isoString - ISO date string (e.g., "2025-09-20T19:00:00.000Z")
 * @param timezone - Optional timezone identifier (e.g., "America/Los_Angeles")
 * @returns Formatted date object with date and time strings
 */
export function formatEventDate(isoString: string, timezone?: string) {
  if (!isoString) {
    return EMPTY_EVENT_DATE_DISPLAY;
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_EVENT_DATE_DISPLAY;
  }

  const timeZoneOptions = getIntlTimeZoneOptions(timezone);

  // Format date as "Sep 20, 2025"
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...timeZoneOptions,
  });

  // Format time as "7:00 PM"
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...timeZoneOptions,
  });

  // Format time with timezone if provided
  let timeWithTz = formattedTime;
  if (timezone) {
    const tzAbbr = getTimezoneAbbreviationSync(timezone);
    timeWithTz = `${formattedTime} ${tzAbbr}`;
  }

  // Day of week
  const dayOfWeek = date.toLocaleDateString('en-US', {
    weekday: 'short',
    ...timeZoneOptions,
  });

  // Short date format "Sep 20"
  const shortDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...timeZoneOptions,
  });

  const monthShort = date
    .toLocaleDateString('en-US', {
      month: 'short',
      ...timeZoneOptions,
    })
    .toUpperCase();

  const dayOfMonth = date.toLocaleDateString('en-US', {
    day: 'numeric',
    ...timeZoneOptions,
  });

  const longDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...timeZoneOptions,
  });

  return {
    date: formattedDate,
    time: formattedTime,
    timeWithTz,
    dayOfWeek,
    shortDate,
    monthShort,
    dayOfMonth,
    longDate,
  };
}

function getEventDateRangeParts(date: Date, timezone?: string): EventDateRangeParts {
  const timeZoneOptions = getIntlTimeZoneOptions(timezone);

  return {
    day: date.toLocaleDateString('en-US', {
      day: 'numeric',
      ...timeZoneOptions,
    }),
    month: date.toLocaleDateString('en-US', {
      month: 'long',
      ...timeZoneOptions,
    }),
    weekdayShort: date.toLocaleDateString('en-US', {
      weekday: 'short',
      ...timeZoneOptions,
    }),
    year: date.toLocaleDateString('en-US', {
      year: 'numeric',
      ...timeZoneOptions,
    }),
  };
}

export function formatEventDateRange(startIso: string, endIso: string, timezone?: string): string {
  if (!startIso) {
    return '';
  }

  if (!endIso) {
    return formatEventDate(startIso, timezone).longDate;
  }

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  if (Number.isNaN(startDate.getTime())) {
    return '';
  }

  if (Number.isNaN(endDate.getTime())) {
    return formatEventDate(startIso, timezone).longDate;
  }

  const startParts = getEventDateRangeParts(startDate, timezone);
  const endParts = getEventDateRangeParts(endDate, timezone);
  const isSameDay =
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.day === endParts.day;

  if (isSameDay) {
    return formatEventDate(startIso, timezone).longDate;
  }

  const isSameMonth = startParts.year === endParts.year && startParts.month === endParts.month;
  const endLabel = isSameMonth
    ? `${endParts.weekdayShort}, ${endParts.day}`
    : `${endParts.weekdayShort}, ${endParts.month} ${endParts.day}`;

  return `${startParts.weekdayShort}, ${startParts.month} ${startParts.day} - ${endLabel}`;
}

function getEventDateRangePartsFromInput(input: EventDatePartsInput): EventDateRangeParts | null {
  if (isValidDateParts(input.year, input.month, input.day)) {
    return getEventDateRangeParts(
      new Date(input.year as number, (input.month as number) - 1, input.day as number),
      input.timezone
    );
  }

  if (!input.fallbackIso) {
    return null;
  }

  const fallbackDate = new Date(input.fallbackIso);
  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return getEventDateRangeParts(fallbackDate, input.timezone);
}

function isValidDateParts(
  year?: number | null,
  month?: number | null,
  day?: number | null
): boolean {
  if (
    year === null ||
    month === null ||
    day === null ||
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatTimeFromParts(hours?: number | null, minutes?: number | null): string {
  if (
    hours === null ||
    minutes === null ||
    hours === undefined ||
    minutes === undefined ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < MIN_HOUR ||
    hours > MAX_HOUR ||
    minutes < MIN_MINUTE ||
    minutes > MAX_MINUTE
  ) {
    return '';
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function hasValidTimeParts(hours?: number | null, minutes?: number | null): boolean {
  return formatTimeFromParts(hours, minutes) !== '';
}

function areSameCalendarDay(start: EventDatePartsInput, end: EventDatePartsInput): boolean {
  if (
    isValidDateParts(start.year, start.month, start.day) &&
    isValidDateParts(end.year, end.month, end.day)
  ) {
    return start.year === end.year && start.month === end.month && start.day === end.day;
  }

  const startDisplay = formatEventDateFromParts(start);
  const endDisplay = formatEventDateFromParts(end);

  if (!startDisplay.date || !endDisplay.date) {
    return true;
  }

  return startDisplay.date === endDisplay.date;
}

export function formatEventDateFromParts({
  year,
  month,
  day,
  hours,
  minutes,
  timezone,
  fallbackIso,
}: EventDatePartsInput): EventDateDisplay {
  const cacheKey = `${year ?? 'n'}|${month ?? 'n'}|${day ?? 'n'}|${hours ?? 'n'}|${minutes ?? 'n'}|${timezone ?? ''}|${fallbackIso ?? ''}`;
  const cached = datePartsDisplayCache.get(cacheKey);
  if (cached) {
    return { ...cached };
  }

  if (!isValidDateParts(year, month, day)) {
    if (fallbackIso) {
      const fallbackDisplay = formatEventDate(fallbackIso, timezone);
      datePartsDisplayCache.set(cacheKey, fallbackDisplay);
      return { ...fallbackDisplay };
    }

    return EMPTY_EVENT_DATE_DISPLAY;
  }

  if (!hasValidTimeParts(hours, minutes) && fallbackIso) {
    const fallbackDisplay = formatEventDate(fallbackIso, timezone);
    datePartsDisplayCache.set(cacheKey, fallbackDisplay);
    return { ...fallbackDisplay };
  }

  const localDate = new Date(year as number, (month as number) - 1, day as number);
  const formattedTime = formatTimeFromParts(hours, minutes);

  const timezoneAbbreviation = timezone ? getTimezoneAbbreviationSync(timezone) : '';

  const display = {
    date: localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: formattedTime,
    timeWithTz:
      formattedTime && timezoneAbbreviation
        ? `${formattedTime} ${timezoneAbbreviation}`
        : formattedTime,
    dayOfWeek: localDate.toLocaleDateString('en-US', {
      weekday: 'short',
    }),
    shortDate: localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    monthShort: localDate
      .toLocaleDateString('en-US', {
        month: 'short',
      })
      .toUpperCase(),
    dayOfMonth: localDate.toLocaleDateString('en-US', {
      day: 'numeric',
    }),
    longDate: localDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  };

  datePartsDisplayCache.set(cacheKey, display);
  if (datePartsDisplayCache.size > DATE_PARTS_CACHE_LIMIT) {
    const oldestKey = datePartsDisplayCache.keys().next().value;
    if (oldestKey) {
      datePartsDisplayCache.delete(oldestKey);
    }
  }

  return { ...display };
}

export function formatEventDateRangeFromParts({
  start,
  end,
}: EventDateRangeInput): EventDateRangeDisplay {
  const startDate = formatEventDateFromParts(start);
  const endDate = formatEventDateFromParts(end);
  const isMultiDay = !areSameCalendarDay(start, end);

  const startLabel = startDate.longDate || startDate.date;
  const endLabel = endDate.longDate || endDate.date;
  const startParts = getEventDateRangePartsFromInput(start);
  const endParts = getEventDateRangePartsFromInput(end);
  const multiDayLabel =
    isMultiDay && startParts && endParts
      ? `${startParts.weekdayShort}, ${startParts.month} ${startParts.day} - ${
          startParts.year === endParts.year && startParts.month === endParts.month
            ? `${endParts.weekdayShort}, ${endParts.day}`
            : `${endParts.weekdayShort}, ${endParts.month} ${endParts.day}`
        }`
      : null;

  return {
    startDate,
    endDate,
    displayDate: multiDayLabel ?? (startLabel || endLabel || ''),
    isMultiDay,
  };
}

/**
 * Get relative time string (e.g., "2h ago", "1d ago")
 */
export function getRelativeTime(isoString: string): string {
  if (!isoString) return '';

  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

/**
 * Format date header for event grouping
 * Returns "Today", "Tomorrow", or full date format (e.g., "Wednesday, December 17")
 * @param date - Date string in YYYY-MM-DD format
 */
export function formatDateHeader(date: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (date === today) return 'Today';
  if (date === tomorrowStr) return 'Tomorrow';

  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
