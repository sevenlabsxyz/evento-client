import { formatEventDate, formatEventDateFromParts } from '@/lib/utils/date';

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
});
