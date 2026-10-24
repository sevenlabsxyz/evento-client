import { DEFAULT_LIST_NAME } from '@/lib/hooks/use-ensure-default-list';
import { getActiveLocale } from '@/lib/i18n/active-locale';
import { EventWithUser, ListEvent, UserList } from '@/lib/types/api';
import { formatDistanceToNow, Locale } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';

export const LIST_NAME_MAX_LENGTH = 50;
export const LIST_DESCRIPTION_MAX_LENGTH = 200;

export type ListEventFilter = 'upcoming' | 'past' | 'all';
export type ListEventSort = 'added' | 'event-date';

/**
 * The server flags a default list via `is_default`; accounts without one get a
 * client-created "Saved Events" list (see `useEnsureDefaultList`), which plays
 * the same role and must not be deletable either.
 */
export function isDefaultList(list: UserList, lists: UserList[]): boolean {
  if (list.is_default) return true;
  return !lists.some((candidate) => candidate.is_default) && list.name === DEFAULT_LIST_NAME;
}

/** Default list first, then the server order (creation date). */
export function orderLists(lists: UserList[]): UserList[] {
  const defaultList = lists.find((list) => isDefaultList(list, lists));
  if (!defaultList) return lists;
  return [defaultList, ...lists.filter((list) => list.id !== defaultList.id)];
}

/** Translated via `lists.nameErrors.<code>` (with `{ max: LIST_NAME_MAX_LENGTH }`). */
export type ListNameError = 'required' | 'tooLong' | 'duplicate';

/** Validation shared by create and rename; mirrors the API's rules. */
export function validateListName(
  rawName: string,
  lists: UserList[],
  excludeListId?: string
): ListNameError | null {
  const name = rawName.trim();
  if (!name) return 'required';
  if (name.length > LIST_NAME_MAX_LENGTH) return 'tooLong';
  if (lists.some((list) => list.id !== excludeListId && list.name === name)) {
    return 'duplicate';
  }
  return null;
}

function toTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

/** Events end at `computed_end_date`; fall back to the start when the end is missing. */
export function isPastEvent(event: EventWithUser, nowMs: number): boolean {
  const endMs = toTime(event.computed_end_date);
  const referenceMs = Number.isNaN(endMs) ? toTime(event.computed_start_date) : endMs;
  return !Number.isNaN(referenceMs) && referenceMs < nowMs;
}

/**
 * Adding or removing events doesn't bump the list's `updated_at`, so the most
 * recent `added_at` counts as activity too.
 */
export function getListLastActivity(list: UserList, events: ListEvent[] | undefined): string {
  let latest = list.updated_at;
  let latestMs = toTime(latest);
  for (const entry of events ?? []) {
    const addedMs = toTime(entry.added_at);
    if (!Number.isNaN(addedMs) && (Number.isNaN(latestMs) || addedMs > latestMs)) {
      latest = entry.added_at;
      latestMs = addedMs;
    }
  }
  return latest;
}

const DATE_FNS_LOCALES: Record<string, Locale> = { en: enUS, 'pt-BR': ptBR, es };

export function formatRelativeTime(value: string): string | null {
  const time = toTime(value);
  if (Number.isNaN(time)) return null;
  return formatDistanceToNow(time, {
    addSuffix: true,
    locale: DATE_FNS_LOCALES[getActiveLocale()] ?? enUS,
  });
}

export function filterListEvents(
  entries: ListEvent[],
  filter: ListEventFilter,
  nowMs: number
): ListEvent[] {
  if (filter === 'all') return entries;
  const wantPast = filter === 'past';
  return entries.filter((entry) => isPastEvent(entry.event, nowMs) === wantPast);
}

/**
 * `added`: newest saves first. `event-date`: upcoming soonest-first, then past
 * events most-recent-first, so "All" reads naturally in both directions.
 */
export function sortListEvents(
  entries: ListEvent[],
  sort: ListEventSort,
  nowMs: number
): ListEvent[] {
  const sorted = [...entries];
  if (sort === 'added') {
    return sorted.sort((a, b) => (toTime(b.added_at) || 0) - (toTime(a.added_at) || 0));
  }

  return sorted.sort((a, b) => {
    const aPast = isPastEvent(a.event, nowMs);
    const bPast = isPastEvent(b.event, nowMs);
    if (aPast !== bPast) return aPast ? 1 : -1;

    const aStart = toTime(a.event.computed_start_date);
    const bStart = toTime(b.event.computed_start_date);
    if (Number.isNaN(aStart) || Number.isNaN(bStart)) {
      return Number.isNaN(aStart) ? (Number.isNaN(bStart) ? 0 : 1) : -1;
    }
    return aPast ? bStart - aStart : aStart - bStart;
  });
}

/** Events for the cover mosaic, most recently saved first (missing covers use the default). */
export function getListCovers(events: ListEvent[] | undefined, limit = 4): ListEvent[] {
  if (!events) return [];
  return [...events]
    .sort((a, b) => (toTime(b.added_at) || 0) - (toTime(a.added_at) || 0))
    .slice(0, limit);
}
