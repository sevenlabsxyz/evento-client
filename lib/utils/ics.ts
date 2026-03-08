export function formatICSDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function isNumericDatePart(
  value: number | null | undefined,
  min: number,
  max: number
): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function sanitizeIcsTimezone(timezone?: string | null): string {
  if (!timezone) {
    return '';
  }

  const trimmedTimezone = timezone.trim();
  if (!trimmedTimezone) {
    return '';
  }

  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: trimmedTimezone,
    });

    return trimmedTimezone;
  } catch {
    return '';
  }
}

interface ICSDateFromPartsParams {
  year?: number | null;
  month?: number | null;
  day?: number | null;
  hours?: number | null;
  minutes?: number | null;
  timezone?: string | null;
  fallbackIso?: string | null;
}

export function formatICSDateFromParts(params: ICSDateFromPartsParams): string {
  const { year, month, day, hours, minutes, timezone, fallbackIso } = params;

  if (
    !isNumericDatePart(year, 1, 9999) ||
    !isNumericDatePart(month, 1, 12) ||
    !isNumericDatePart(day, 1, 31) ||
    !isNumericDatePart(hours, 0, 23) ||
    !isNumericDatePart(minutes, 0, 59)
  ) {
    const fallbackDate = formatICSDate(fallbackIso ?? '');
    return fallbackDate ? `:${fallbackDate}` : '';
  }

  const localDate = `${String(year).padStart(4, '0')}${String(month).padStart(2, '0')}${String(
    day
  ).padStart(2, '0')}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`;

  const normalizedTimezone = sanitizeIcsTimezone(timezone);
  const timezoneSuffix = normalizedTimezone ? `;TZID=${normalizedTimezone}` : '';

  return `${timezoneSuffix}:${localDate}`;
}
