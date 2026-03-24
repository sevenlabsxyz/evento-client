import { EventWithUser } from '@/lib/types/api';

export interface GroupedProfileEvents {
  date: string;
  events: EventWithUser[];
}

export type ProfileEventSortDirection = 'asc' | 'desc';

export function hasValidProfileEventDate(eventDate: unknown): eventDate is string {
  return typeof eventDate === 'string' && eventDate.trim().length > 0;
}

function isValidDatePart(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function hasDisplayDateParts(event: EventWithUser): boolean {
  return (
    isValidDatePart(event.start_date_year, 1, 9999) &&
    isValidDatePart(event.start_date_month, 1, 12) &&
    isValidDatePart(event.start_date_day, 1, 31)
  );
}

function hasDisplayTimeParts(event: EventWithUser): boolean {
  return (
    isValidDatePart(event.start_date_hours, 0, 23) && isValidDatePart(event.start_date_minutes, 0, 59)
  );
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

export function getProfileEventDateKey(event: EventWithUser): string | null {
  if (hasDisplayDateParts(event)) {
    return `${event.start_date_year}-${padDatePart(event.start_date_month)}-${padDatePart(event.start_date_day)}`;
  }

  if (!hasValidProfileEventDate(event.computed_start_date)) {
    return null;
  }

  return event.computed_start_date.slice(0, 10);
}

export function getProfileEventStartTimestamp(event: EventWithUser): number | null {
  if (hasValidProfileEventDate(event.computed_start_date)) {
    const computedTimestamp = new Date(event.computed_start_date).getTime();
    if (!Number.isNaN(computedTimestamp)) {
      return computedTimestamp;
    }
  }

  if (!hasDisplayDateParts(event)) {
    return null;
  }

  const hours = hasDisplayTimeParts(event) ? event.start_date_hours : 0;
  const minutes = hasDisplayTimeParts(event) ? event.start_date_minutes : 0;
  const fallbackTimestamp = new Date(
    event.start_date_year,
    event.start_date_month - 1,
    event.start_date_day,
    hours,
    minutes
  ).getTime();

  return Number.isNaN(fallbackTimestamp) ? null : fallbackTimestamp;
}

function getEventTimestamp(event: EventWithUser): number {
  if (hasDisplayDateParts(event)) {
    const hours = hasDisplayTimeParts(event) ? event.start_date_hours : 0;
    const minutes = hasDisplayTimeParts(event) ? event.start_date_minutes : 0;

    return new Date(
      event.start_date_year,
      event.start_date_month - 1,
      event.start_date_day,
      hours,
      minutes
    ).getTime();
  }

  if (!hasValidProfileEventDate(event.computed_start_date)) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(event.computed_start_date).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function sortProfileEventsByStartDate(
  events: EventWithUser[],
  direction: ProfileEventSortDirection
): EventWithUser[] {
  return [...events]
    .filter((event) => getProfileEventDateKey(event) !== null)
    .sort((a, b) => {
      const timestampA = getEventTimestamp(a);
      const timestampB = getEventTimestamp(b);

      return direction === 'asc' ? timestampA - timestampB : timestampB - timestampA;
    });
}

export function sortAndGroupProfileEvents(
  events: EventWithUser[],
  direction: ProfileEventSortDirection
): GroupedProfileEvents[] {
  return sortProfileEventsByStartDate(events, direction).reduce<GroupedProfileEvents[]>(
    (groups, event) => {
      const date = getProfileEventDateKey(event);
      if (!date) {
        return groups;
      }

      const existingGroup = groups.find((group) => group.date === date);

      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ date, events: [event] });
      }

      return groups;
    },
    []
  );
}
