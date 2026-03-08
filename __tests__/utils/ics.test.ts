import {
  formatICSDate,
  formatICSDateFromParts,
  isNumericDatePart,
  sanitizeIcsTimezone,
} from '@/lib/utils/ics';

describe('formatICSDate', () => {
  it('formats a valid ISO timestamp to ICS date format', () => {
    expect(formatICSDate('2026-04-26T17:00:00.000Z')).toBe('20260426T170000Z');
  });

  it('returns an empty string for invalid timestamps', () => {
    expect(formatICSDate('not-a-date')).toBe('');
  });
});

describe('isNumericDatePart', () => {
  it('validates numeric range constraints', () => {
    expect(isNumericDatePart(10, 1, 12)).toBe(true);
    expect(isNumericDatePart(null, 1, 12)).toBe(false);
    expect(isNumericDatePart(13, 1, 12)).toBe(false);
    expect(isNumericDatePart(1.5, 1, 12)).toBe(false);
  });
});

describe('sanitizeIcsTimezone', () => {
  it('keeps valid IANA timezones', () => {
    expect(sanitizeIcsTimezone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('returns empty string for invalid timezones', () => {
    expect(sanitizeIcsTimezone('bad-timezone')).toBe('');
  });
});

describe('formatICSDateFromParts', () => {
  it('uses local date parts with a valid timezone', () => {
    expect(
      formatICSDateFromParts({
        year: 2026,
        month: 4,
        day: 26,
        hours: 10,
        minutes: 0,
        timezone: 'America/Los_Angeles',
      })
    ).toBe(';TZID=America/Los_Angeles:20260426T100000');
  });

  it('falls back to computed date when time parts are invalid', () => {
    expect(
      formatICSDateFromParts({
        year: 2026,
        month: 4,
        day: 26,
        hours: null,
        minutes: null,
        timezone: 'America/Los_Angeles',
        fallbackIso: '2026-04-26T17:00:00.000Z',
      })
    ).toBe(':20260426T170000Z');
  });

  it('drops invalid timezone values and writes floating local time', () => {
    expect(
      formatICSDateFromParts({
        year: 2026,
        month: 4,
        day: 26,
        hours: 10,
        minutes: 0,
        timezone: 'bad-timezone',
      })
    ).toBe(':20260426T100000');
  });
});
