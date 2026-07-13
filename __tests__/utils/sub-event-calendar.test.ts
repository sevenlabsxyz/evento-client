import {
  buildSubEventCalendar,
  hasValidSubEventStart,
  SUB_EVENT_CALENDAR_MINIMUM_MARKER_MINUTES,
  SUB_EVENT_CALENDAR_TIME_BUFFER_HOURS,
  SubEventCalendarEvent,
} from '@/lib/utils/sub-event-calendar';

function event(id: string, overrides: Partial<SubEventCalendarEvent> = {}): SubEventCalendarEvent {
  return {
    id,
    title: `Event ${id}`,
    timezone: 'America/Los_Angeles',
    start_date_year: 2026,
    start_date_month: 7,
    start_date_day: 12,
    start_date_hours: 9,
    start_date_minutes: 0,
    end_date_year: 2026,
    end_date_month: 7,
    end_date_day: 12,
    end_date_hours: 10,
    end_date_minutes: 0,
    computed_start_date: '2026-07-12T16:00:00.000Z',
    computed_end_date: '2026-07-12T17:00:00.000Z',
    ...overrides,
  };
}

describe('hasValidSubEventStart', () => {
  it('treats midnight as a valid start time', () => {
    expect(
      hasValidSubEventStart(
        event('midnight', {
          start_date_hours: 0,
          start_date_minutes: 0,
        })
      )
    ).toBe(true);
  });

  it.each([
    ['missing hour', { start_date_hours: null }],
    ['missing minute', { start_date_minutes: null }],
    ['invalid hour', { start_date_hours: 24 }],
    ['invalid minute', { start_date_minutes: 60 }],
    ['impossible date', { start_date_month: 2, start_date_day: 30 }],
  ])('rejects %s', (_label, overrides) => {
    expect(hasValidSubEventStart(event('invalid', overrides))).toBe(false);
  });
});

describe('buildSubEventCalendar', () => {
  it('converts instants into the parent timezone before assigning columns and minutes', () => {
    const model = buildSubEventCalendar(
      [
        event('timezone', {
          start_date_hours: 18,
          computed_start_date: '2026-07-13T01:00:00.000Z',
          computed_end_date: '2026-07-13T02:30:00.000Z',
        }),
      ],
      'America/New_York'
    );

    expect(model.timezone).toBe('America/New_York');
    expect(model.dates.map((date) => date.key)).toEqual(['2026-07-12']);
    expect(model.segments[0]).toMatchObject({
      startMinute: 21 * 60,
      endMinute: 22 * 60 + 30,
      eventStartMinute: 21 * 60,
      eventEndMinute: 22 * 60 + 30,
    });
    expect(model.startHour).toBe(16);
    expect(model.endHour).toBe(24);
  });

  it('adds five hours before the earliest start and after the latest end', () => {
    const model = buildSubEventCalendar(
      [
        event('buffered', {
          computed_start_date: '2026-07-12T16:30:00.000Z',
          computed_end_date: '2026-07-12T18:15:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(SUB_EVENT_CALENDAR_TIME_BUFFER_HOURS).toBe(5);
    expect(model.startHour).toBe(4);
    expect(model.endHour).toBe(17);
  });

  it('clamps an early schedule morning buffer at midnight', () => {
    const model = buildSubEventCalendar(
      [
        event('early', {
          computed_start_date: '2026-07-12T09:30:00.000Z',
          computed_end_date: '2026-07-12T10:30:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.startHour).toBe(0);
    expect(model.endHour).toBe(9);
  });

  it('clamps a late schedule evening buffer at midnight', () => {
    const model = buildSubEventCalendar(
      [
        event('late', {
          computed_start_date: '2026-07-13T01:30:00.000Z',
          computed_end_date: '2026-07-13T03:00:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.startHour).toBe(13);
    expect(model.endHour).toBe(24);
  });

  it('uses actual duration and a minimum visual floor without changing a short event end', () => {
    const model = buildSubEventCalendar(
      [
        event('short', {
          computed_end_date: '2026-07-12T16:05:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.segments[0]).toMatchObject({
      startMinute: 540,
      endMinute: 545,
      layoutEndMinute: 540 + SUB_EVENT_CALENDAR_MINIMUM_MARKER_MINUTES,
      hasValidEnd: true,
    });
  });

  it.each([
    ['missing', null],
    ['invalid', 'not-a-date'],
    ['not later', '2026-07-12T15:59:00.000Z'],
  ])('renders a minimum-height marker when the end is %s', (_label, computedEnd) => {
    const model = buildSubEventCalendar(
      [
        event('marker', {
          computed_end_date: computedEnd,
          end_date_hours: null,
          end_date_minutes: null,
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.segments[0]).toMatchObject({
      startMinute: 540,
      endMinute: 540,
      layoutEndMinute: 555,
      hasValidEnd: false,
      endTimestamp: null,
    });
    expect(model.startHour).toBe(4);
    expect(model.endHour).toBe(15);
  });

  it('splits cross-midnight events into navigable segments in chronological date columns', () => {
    const model = buildSubEventCalendar(
      [
        event('overnight', {
          computed_start_date: '2026-07-13T06:30:00.000Z',
          computed_end_date: '2026-07-13T07:45:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.dates.map((date) => date.key)).toEqual(['2026-07-12', '2026-07-13']);
    expect(model.segments).toHaveLength(2);
    expect(model.segments[0]).toMatchObject({
      columnKey: '2026-07-12',
      startMinute: 1410,
      endMinute: 1440,
      continuesBefore: false,
      continuesAfter: true,
    });
    expect(model.segments[1]).toMatchObject({
      columnKey: '2026-07-13',
      startMinute: 0,
      endMinute: 45,
      continuesBefore: true,
      continuesAfter: false,
    });
    expect(model.startHour).toBe(0);
    expect(model.endHour).toBe(24);
  });

  it('does not create an empty continuation when an event ends exactly at midnight', () => {
    const model = buildSubEventCalendar(
      [
        event('to-midnight', {
          computed_start_date: '2026-07-13T06:00:00.000Z',
          computed_end_date: '2026-07-13T07:00:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(model.dates.map((date) => date.key)).toEqual(['2026-07-12']);
    expect(model.segments[0]).toMatchObject({
      startMinute: 1380,
      endMinute: 1440,
      continuesAfter: false,
    });
  });

  it('assigns deterministic side-by-side lanes only within overlapping clusters', () => {
    const model = buildSubEventCalendar(
      [
        event('b', {
          computed_start_date: '2026-07-12T16:30:00.000Z',
          computed_end_date: '2026-07-12T17:30:00.000Z',
        }),
        event('c', {
          computed_start_date: '2026-07-12T18:00:00.000Z',
          computed_end_date: '2026-07-12T19:00:00.000Z',
        }),
        event('a', {
          computed_start_date: '2026-07-12T16:00:00.000Z',
          computed_end_date: '2026-07-12T18:00:00.000Z',
        }),
      ],
      'America/Los_Angeles'
    );

    expect(
      model.segments.map(({ eventId, lane, laneCount }) => ({ eventId, lane, laneCount }))
    ).toEqual([
      { eventId: 'a', lane: 0, laneCount: 2 },
      { eventId: 'b', lane: 1, laneCount: 2 },
      { eventId: 'c', lane: 0, laneCount: 1 },
    ]);
  });

  it('keeps unscheduled events in input order while sorting scheduled date columns', () => {
    const unscheduledOne = event('tbd-1', { start_date_hours: null });
    const later = event('later', {
      start_date_day: 13,
      computed_start_date: '2026-07-13T16:00:00.000Z',
      computed_end_date: '2026-07-13T17:00:00.000Z',
    });
    const unscheduledTwo = event('tbd-2', { start_date_minutes: null });
    const earlier = event('earlier');
    const input = [unscheduledOne, later, unscheduledTwo, earlier];
    const originalOrder = input.map(({ id }) => id);

    const model = buildSubEventCalendar(input, 'America/Los_Angeles');

    expect(model.dates.map((date) => date.key)).toEqual(['2026-07-12', '2026-07-13']);
    expect(model.unscheduled.map(({ id }) => id)).toEqual(['tbd-1', 'tbd-2']);
    expect(input.map(({ id }) => id)).toEqual(originalOrder);
    expect(model.unscheduled[0]).toBe(unscheduledOne);
  });

  it('falls back to valid source-local fields when a computed start is unavailable', () => {
    const model = buildSubEventCalendar(
      [
        event('fallback', {
          computed_start_date: 'invalid',
          computed_end_date: null,
          start_date_hours: 9,
          start_date_minutes: 30,
          end_date_hours: null,
          end_date_minutes: null,
        }),
      ],
      'America/New_York'
    );

    expect(model.segments[0]).toMatchObject({
      columnKey: '2026-07-12',
      startMinute: 12 * 60 + 30,
      endMinute: 12 * 60 + 30,
    });
  });

  it('retains all events in Time TBD when none has a valid start', () => {
    const input = [event('one', { start_date_hours: null }), event('two', { start_date_day: 32 })];
    const model = buildSubEventCalendar(input, 'invalid/timezone');

    expect(model).toMatchObject({
      timezone: 'UTC',
      dates: [],
      segments: [],
      unscheduled: input,
      startHour: 0,
      endHour: 24,
    });
  });
});
