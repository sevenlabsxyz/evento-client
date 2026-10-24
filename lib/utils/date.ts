import { getIntlLocale } from '@/lib/i18n/active-locale';
import { translateHooks } from '@/lib/i18n/active-translator';
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

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const UNDATED_DATE_KEY = '__undated__';

function parseDateOnlyString(date?: string | null): Date | null {
  if (typeof date !== 'string') {
    return null;
  }

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

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
  const formattedDate = date.toLocaleDateString(getIntlLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...timeZoneOptions,
  });

  // Format time as "7:00 PM" (en) / "19:00" (pt-BR, es): the locale's own clock
  const formattedTime = normalizeTimeSpacing(
    date.toLocaleTimeString(getIntlLocale(), {
      hour: 'numeric',
      minute: '2-digit',
      ...timeZoneOptions,
    })
  );

  // Format time with timezone if provided
  let timeWithTz = formattedTime;
  if (timezone) {
    const tzAbbr = getTimezoneAbbreviationSync(timezone);
    timeWithTz = `${formattedTime} ${tzAbbr}`;
  }

  // Day of week
  const dayOfWeek = date.toLocaleDateString(getIntlLocale(), {
    weekday: 'short',
    ...timeZoneOptions,
  });

  // Short date format "Sep 20"
  const shortDate = date.toLocaleDateString(getIntlLocale(), {
    month: 'short',
    day: 'numeric',
    ...timeZoneOptions,
  });

  const monthShort = date
    .toLocaleDateString(getIntlLocale(), {
      month: 'short',
      ...timeZoneOptions,
    })
    .toLocaleUpperCase(getIntlLocale());

  const dayOfMonth = date.toLocaleDateString(getIntlLocale(), {
    day: 'numeric',
    ...timeZoneOptions,
  });

  const longDate = date.toLocaleDateString(getIntlLocale(), {
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
    day: date.toLocaleDateString(getIntlLocale(), {
      day: 'numeric',
      ...timeZoneOptions,
    }),
    month: date.toLocaleDateString(getIntlLocale(), {
      month: 'long',
      ...timeZoneOptions,
    }),
    weekdayShort: date.toLocaleDateString(getIntlLocale(), {
      weekday: 'short',
      ...timeZoneOptions,
    }),
    year: date.toLocaleDateString(getIntlLocale(), {
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
    // Date parts (year/month/day) are already in the event's local timezone.
    // Don't apply timezone conversion; doing so would re-shift an already-local date.
    return getEventDateRangeParts(
      new Date(input.year as number, (input.month as number) - 1, input.day as number)
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

/**
 * Newer ICU data separates the day period with a narrow no-break space
 * ("7:00\u202fPM"); keep the plain space the UI and tests expect.
 */
export function normalizeTimeSpacing(value: string): string {
  return value.replace(/\u202f/g, ' ');
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

  return normalizeTimeSpacing(
    new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(getIntlLocale(), {
      hour: 'numeric',
      minute: '2-digit',
    })
  );
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
  const cacheKey = `${getIntlLocale()}|${year ?? 'n'}|${month ?? 'n'}|${day ?? 'n'}|${hours ?? 'n'}|${minutes ?? 'n'}|${timezone ?? ''}|${fallbackIso ?? ''}`;
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
    date: localDate.toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: formattedTime,
    timeWithTz:
      formattedTime && timezoneAbbreviation
        ? `${formattedTime} ${timezoneAbbreviation}`
        : formattedTime,
    dayOfWeek: localDate.toLocaleDateString(getIntlLocale(), {
      weekday: 'short',
    }),
    shortDate: localDate.toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
    }),
    monthShort: localDate
      .toLocaleDateString(getIntlLocale(), {
        month: 'short',
      })
      .toLocaleUpperCase(getIntlLocale()),
    dayOfMonth: localDate.toLocaleDateString(getIntlLocale(), {
      day: 'numeric',
    }),
    longDate: localDate.toLocaleDateString(getIntlLocale(), {
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
export function formatDateHeader(date?: string | null): string {
  if (!date || date === UNDATED_DATE_KEY) {
    return translateHooks('dates.noDateSet');
  }

  const today = toLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateKey(tomorrow);

  if (date === today) return translateHooks('dates.today');
  if (date === tomorrowStr) return translateHooks('dates.tomorrow');

  const parsedDate = parseDateOnlyString(date);
  if (!parsedDate) {
    const fallbackDate = new Date(date);
    if (Number.isNaN(fallbackDate.getTime())) {
      return translateHooks('dates.noDateSet');
    }

    return fallbackDate.toLocaleDateString(getIntlLocale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return parsedDate.toLocaleDateString(getIntlLocale(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
