import {
  formatDateHeader,
  formatEventDate,
  formatEventDateFromParts,
  formatEventDateRangeFromParts,
} from '@/lib/utils/date';

describe('formatEventDate', () => {
  it('formats event date/time using the provided event timezone', () => {
    const formatted = formatEventDate('2026-04-26T17:00:00.000Z', 'America/Los_Angeles');

    expect(formatted.date).toBe('Apr 26, 2026');
    expect(formatted.time).toBe('10:00 AM');
    expect(formatted.timeWithTz).toBe('10:00 AM PT');
    expect(formatted.monthShort).toBe('APR');
    expect(formatted.dayOfMonth).toBe('26');
    expect(formatted.longDate).toBe('Sunday, April 26');
  });

  it('renders a different local clock time for a different event timezone', () => {
    const formatted = formatEventDate('2026-04-26T17:00:00.000Z', 'America/Chicago');

    expect(formatted.time).toBe('12:00 PM');
    expect(formatted.timeWithTz).toBe('12:00 PM CT');
  });

  it('uses the event timezone for date parts when the UTC day differs', () => {
    const formatted = formatEventDate('2026-04-27T01:30:00.000Z', 'America/Los_Angeles');

    expect(formatted.date).toBe('Apr 26, 2026');
    expect(formatted.shortDate).toBe('Apr 26');
    expect(formatted.monthShort).toBe('APR');
    expect(formatted.dayOfMonth).toBe('26');
    expect(formatted.longDate).toBe('Sunday, April 26');
    expect(formatted.time).toBe('6:30 PM');
  });
});

describe('formatEventDateFromParts', () => {
  it('renders the same local event time from raw parts regardless of viewer timezone', () => {
    const formatted = formatEventDateFromParts({
      year: 2026,
      month: 4,
      day: 26,
      hours: 10,
      minutes: 0,
      timezone: 'America/Los_Angeles',
    });

    expect(formatted.date).toBe('Apr 26, 2026');
    expect(formatted.time).toBe('10:00 AM');
    expect(formatted.timeWithTz).toBe('10:00 AM PT');
    expect(formatted.monthShort).toBe('APR');
    expect(formatted.dayOfMonth).toBe('26');
    expect(formatted.longDate).toBe('Sunday, April 26');
  });

  it('falls back to computed timestamp formatting when date parts are invalid', () => {
    const formatted = formatEventDateFromParts({
      year: 2026,
      month: 2,
      day: 31,
      hours: 10,
      minutes: 0,
      timezone: 'America/Los_Angeles',
      fallbackIso: '2026-04-26T17:00:00.000Z',
    });

    expect(formatted.time).toBe('10:00 AM');
    expect(formatted.timeWithTz).toBe('10:00 AM PT');
  });

  it('falls back to computed timestamp formatting when time parts are missing', () => {
    const formatted = formatEventDateFromParts({
      year: 2026,
      month: 4,
      day: 26,
      hours: null,
      minutes: null,
      timezone: 'America/Los_Angeles',
      fallbackIso: '2026-04-26T17:00:00.000Z',
    });

    expect(formatted.date).toBe('Apr 26, 2026');
    expect(formatted.time).toBe('10:00 AM');
    expect(formatted.timeWithTz).toBe('10:00 AM PT');
  });

  it('formats boundary time values correctly from valid parts', () => {
    const midnight = formatEventDateFromParts({
      year: 2026,
      month: 4,
      day: 26,
      hours: 0,
      minutes: 0,
      timezone: 'America/Los_Angeles',
    });

    const endOfDay = formatEventDateFromParts({
      year: 2026,
      month: 4,
      day: 26,
      hours: 23,
      minutes: 59,
      timezone: 'America/Los_Angeles',
    });

    expect(midnight.time).toBe('12:00 AM');
    expect(endOfDay.time).toBe('11:59 PM');
  });
});

describe('formatEventDateRangeFromParts', () => {
  it('returns a single display date for same-day events', () => {
    const formatted = formatEventDateRangeFromParts({
      start: {
        year: 2026,
        month: 4,
        day: 27,
        hours: 13,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
      end: {
        year: 2026,
        month: 4,
        day: 27,
        hours: 17,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
    });

    expect(formatted.isMultiDay).toBe(false);
    expect(formatted.displayDate).toBe('Monday, April 27');
  });

  it('returns a date range for multi-day events', () => {
    const formatted = formatEventDateRangeFromParts({
      start: {
        year: 2026,
        month: 4,
        day: 27,
        hours: 13,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
      end: {
        year: 2026,
        month: 4,
        day: 29,
        hours: 17,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
    });

    expect(formatted.isMultiDay).toBe(true);
    expect(formatted.displayDate).toBe('Mon, April 27 - Wed, 29');
    expect(formatted.startDate.monthShort).toBe('APR');
    expect(formatted.startDate.dayOfMonth).toBe('27');
  });

  it('shows both month names when a multi-day range crosses months', () => {
    const formatted = formatEventDateRangeFromParts({
      start: {
        year: 2026,
        month: 4,
        day: 30,
        hours: 13,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
      end: {
        year: 2026,
        month: 5,
        day: 1,
        hours: 17,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
    });

    expect(formatted.isMultiDay).toBe(true);
    expect(formatted.displayDate).toBe('Thu, April 30 - Fri, May 1');
  });

  it('falls back to a single display date when the end date is invalid', () => {
    const formatted = formatEventDateRangeFromParts({
      start: {
        year: 2026,
        month: 4,
        day: 26,
        hours: 10,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      },
      end: {
        year: 2026,
        month: 4,
        day: 31,
        hours: 17,
        minutes: 0,
        timezone: 'America/Los_Angeles',
        fallbackIso: '2026-04-26T22:00:00.000Z',
      },
    });

    expect(formatted.isMultiDay).toBe(false);
    expect(formatted.displayDate).toBe('Sunday, April 26');
  });
});

describe('formatDateHeader', () => {
  it('formats YYYY-MM-DD headers as local calendar dates without shifting a day', () => {
    expect(formatDateHeader('2026-04-26')).toBe('Sunday, April 26');
    expect(formatDateHeader('2026-04-27')).toBe('Monday, April 27');
  });

  it('returns a safe fallback when the date is missing or invalid', () => {
    expect(formatDateHeader(null as unknown as string)).toBe('No date set');
    expect(formatDateHeader('not-a-date')).toBe('No date set');
  });
});
