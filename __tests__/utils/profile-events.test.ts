import { EventWithUser } from '@/lib/types/api';
import {
  getProfileEventDateKey,
  sortAndGroupProfileEvents,
  sortProfileEventsByStartDate,
} from '@/lib/utils/profile-events';

function createEvent(
  id: string,
  computed_start_date: string,
  overrides: Partial<EventWithUser> = {}
): EventWithUser {
  return {
    id,
    title: `Event ${id}`,
    computed_start_date,
    start_date_year: 2026,
    start_date_month: 4,
    start_date_day: 24,
    start_date_hours: 12,
    start_date_minutes: 0,
    user_details: {
      id: 'user_1',
      username: 'bhd',
      name: 'BHD',
      image: null,
      verification_status: null,
    },
    ...overrides,
  } as EventWithUser;
}

describe('profile-events utilities', () => {
  it('sorts upcoming events by the earliest timestamp first', () => {
    const events = [
      createEvent('later', '2026-04-28T20:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 28,
        start_date_hours: 20,
        start_date_minutes: 0,
      }),
      createEvent('soonest', '2026-04-24T18:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 24,
        start_date_hours: 18,
        start_date_minutes: 0,
      }),
      createEvent('middle', '2026-04-26T13:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 26,
        start_date_hours: 13,
        start_date_minutes: 0,
      }),
    ];

    expect(sortProfileEventsByStartDate(events, 'asc').map((event) => event.id)).toEqual([
      'soonest',
      'middle',
      'later',
    ]);
  });

  it('groups by calendar day after sorting upcoming events', () => {
    const events = [
      createEvent('day-two-late', '2026-04-26T21:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 26,
        start_date_hours: 21,
        start_date_minutes: 0,
      }),
      createEvent('day-one', '2026-04-25T10:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 25,
        start_date_hours: 10,
        start_date_minutes: 0,
      }),
      createEvent('day-two-early', '2026-04-26T09:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 26,
        start_date_hours: 9,
        start_date_minutes: 0,
      }),
    ];

    expect(sortAndGroupProfileEvents(events, 'asc')).toEqual([
      {
        date: '2026-04-25',
        events: [events[1]],
      },
      {
        date: '2026-04-26',
        events: [events[2], events[0]],
      },
    ]);
  });

  it('sorts past events newest first', () => {
    const events = [
      createEvent('oldest', '2026-04-20T10:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 20,
        start_date_hours: 10,
        start_date_minutes: 0,
      }),
      createEvent('newest', '2026-04-23T12:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 23,
        start_date_hours: 12,
        start_date_minutes: 0,
      }),
      createEvent('middle', '2026-04-22T09:00:00.000Z', {
        start_date_year: 2026,
        start_date_month: 4,
        start_date_day: 22,
        start_date_hours: 9,
        start_date_minutes: 0,
      }),
    ];

    expect(sortProfileEventsByStartDate(events, 'desc').map((event) => event.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('prefers displayed date parts over computed_start_date when they disagree', () => {
    const aprilTwentySeventh = createEvent('april-27', '2026-04-26T20:00:00.000Z', {
      start_date_year: 2026,
      start_date_month: 4,
      start_date_day: 27,
      start_date_hours: 13,
      start_date_minutes: 0,
    });
    const aprilTwentySixth = createEvent('april-26', '2026-04-27T17:00:00.000Z', {
      start_date_year: 2026,
      start_date_month: 4,
      start_date_day: 26,
      start_date_hours: 10,
      start_date_minutes: 0,
    });

    expect(getProfileEventDateKey(aprilTwentySeventh)).toBe('2026-04-27');
    expect(getProfileEventDateKey(aprilTwentySixth)).toBe('2026-04-26');
    expect(sortProfileEventsByStartDate([aprilTwentySeventh, aprilTwentySixth], 'asc')).toEqual([
      aprilTwentySixth,
      aprilTwentySeventh,
    ]);
  });
});
