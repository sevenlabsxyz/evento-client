import { formatEventDate, formatEventDateFromParts } from '@/lib/utils/date';
import { logger } from '@/lib/utils/logger';

describe('date formatting utilities', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to computed ISO output when time parts are invalid', () => {
    const result = formatEventDateFromParts({
      year: 2026,
      month: 3,
      day: 7,
      hours: null,
      minutes: null,
      timezone: 'America/Los_Angeles',
      fallbackIso: '2026-03-08T03:45:00.000Z',
    });

    expect(result).toEqual(formatEventDate('2026-03-08T03:45:00.000Z', 'America/Los_Angeles'));
  });

  it('keeps date display but leaves time blank when time parts are invalid without a fallback', () => {
    const result = formatEventDateFromParts({
      year: 2026,
      month: 3,
      day: 7,
      hours: null,
      minutes: null,
      timezone: 'America/Los_Angeles',
    });

    expect(result.date).toBe('Mar 7, 2026');
    expect(result.time).toBe('');
    expect(result.timeWithTz).toBe('');
  });

  it('falls back to computed ISO output when date parts are invalid', () => {
    const result = formatEventDateFromParts({
      year: 2026,
      month: 2,
      day: 31,
      hours: 19,
      minutes: 0,
      timezone: 'America/New_York',
      fallbackIso: '2026-03-01T00:00:00.000Z',
    });

    expect(result).toEqual(formatEventDate('2026-03-01T00:00:00.000Z', 'America/New_York'));
  });

  it('warns and falls back to default formatting when timezone is invalid', () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const result = formatEventDate('2026-03-08T03:45:00.000Z', 'Invalid/Timezone');

    expect(warnSpy).toHaveBeenCalledWith('Invalid timezone provided for date formatting', {
      timezone: 'Invalid/Timezone',
      error: expect.any(String),
    });
    expect(result.date).toBeTruthy();
    expect(result.time).toBeTruthy();
  });
});
