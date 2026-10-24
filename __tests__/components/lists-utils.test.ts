import {
  filterListEvents,
  getListLastActivity,
  isDefaultList,
  orderLists,
  sortListEvents,
  validateListName,
} from '@/components/lists/list-utils';
import { EventWithUser, ListEvent, UserList } from '@/lib/types/api';

jest.mock('@/lib/hooks/use-ensure-default-list', () => ({ DEFAULT_LIST_NAME: 'Saved Events' }));

const NOW = Date.parse('2026-06-15T12:00:00.000Z');

function makeList(overrides: Partial<UserList>): UserList {
  return {
    id: 'list_1',
    creator_id: 'user_1',
    name: 'List',
    description: null,
    is_default: false,
    is_public: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    event_count: 0,
    ...overrides,
  };
}

function makeEntry(id: string, start: string, addedAt: string, end?: string): ListEvent {
  const event = {
    id,
    title: id,
    computed_start_date: start,
    computed_end_date: end ?? start,
  } as EventWithUser;
  return {
    list_event_id: `le_${id}`,
    event_id: id,
    added_at: addedAt,
    added_by: 'user_1',
    event,
  };
}

describe('list utils', () => {
  describe('isDefaultList / orderLists', () => {
    it('prefers the server default flag', () => {
      const lists = [
        makeList({ id: 'a', name: 'Saved Events' }),
        makeList({ id: 'b', name: 'Favorites', is_default: true }),
      ];
      expect(isDefaultList(lists[0], lists)).toBe(false);
      expect(isDefaultList(lists[1], lists)).toBe(true);
      expect(orderLists(lists).map((list) => list.id)).toEqual(['b', 'a']);
    });

    it('treats the client-created "Saved Events" list as default when none is flagged', () => {
      const lists = [
        makeList({ id: 'a', name: 'Trips' }),
        makeList({ id: 'b', name: 'Saved Events' }),
      ];
      expect(isDefaultList(lists[1], lists)).toBe(true);
      expect(orderLists(lists).map((list) => list.id)).toEqual(['b', 'a']);
    });
  });

  describe('validateListName', () => {
    const lists = [makeList({ id: 'a', name: 'Trips' })];

    it('requires a non-blank name', () => {
      expect(validateListName('   ', lists)).toMatch(/name/i);
    });

    it('rejects names over 50 characters', () => {
      expect(validateListName('x'.repeat(51), lists)).toMatch(/50/);
    });

    it('rejects duplicates except for the list being renamed', () => {
      expect(validateListName(' Trips ', lists)).toMatch(/already/i);
      expect(validateListName('Trips', lists, 'a')).toBeNull();
      expect(validateListName('Concerts', lists)).toBeNull();
    });
  });

  describe('filter and sort', () => {
    const past = makeEntry('past', '2026-06-01T18:00:00.000Z', '2026-05-01T00:00:00.000Z');
    const olderPast = makeEntry('older', '2026-03-01T18:00:00.000Z', '2026-05-03T00:00:00.000Z');
    const soon = makeEntry('soon', '2026-06-20T18:00:00.000Z', '2026-05-02T00:00:00.000Z');
    const later = makeEntry('later', '2026-08-01T18:00:00.000Z', '2026-05-04T00:00:00.000Z');
    // Started before now but ends after: still upcoming.
    const ongoing = makeEntry(
      'ongoing',
      '2026-06-15T10:00:00.000Z',
      '2026-04-01T00:00:00.000Z',
      '2026-06-15T14:00:00.000Z'
    );
    const entries = [past, olderPast, soon, later, ongoing];

    it('splits upcoming and past by end time', () => {
      expect(filterListEvents(entries, 'upcoming', NOW).map((entry) => entry.event_id)).toEqual([
        'soon',
        'later',
        'ongoing',
      ]);
      expect(filterListEvents(entries, 'past', NOW).map((entry) => entry.event_id)).toEqual([
        'past',
        'older',
      ]);
      expect(filterListEvents(entries, 'all', NOW)).toHaveLength(5);
    });

    it('sorts by date added, newest first', () => {
      expect(sortListEvents(entries, 'added', NOW).map((entry) => entry.event_id)).toEqual([
        'later',
        'older',
        'soon',
        'past',
        'ongoing',
      ]);
    });

    it('sorts by event date: upcoming soonest first, then past most recent first', () => {
      expect(sortListEvents(entries, 'event-date', NOW).map((entry) => entry.event_id)).toEqual([
        'ongoing',
        'soon',
        'later',
        'past',
        'older',
      ]);
    });
  });

  describe('getListLastActivity', () => {
    it('uses the newest added_at when it is later than updated_at', () => {
      const list = makeList({ updated_at: '2026-05-02T00:00:00.000Z' });
      const entries = [
        makeEntry('a', '2026-07-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
        makeEntry('b', '2026-07-01T00:00:00.000Z', '2026-05-10T00:00:00.000Z'),
      ];
      expect(getListLastActivity(list, entries)).toBe('2026-05-10T00:00:00.000Z');
      expect(getListLastActivity(list, [])).toBe('2026-05-02T00:00:00.000Z');
    });
  });
});
