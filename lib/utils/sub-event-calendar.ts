/**
 * The subset of an API event needed to build the sub-event calendar.
 * EventWithUser is structurally compatible with this type, while the nullable
 * fields reflect what the API can return at runtime.
 */
export interface SubEventCalendarEvent {
  id: string;
  title: string;
  timezone?: string | null;
  start_date_year?: number | null;
  start_date_month?: number | null;
  start_date_day?: number | null;
  start_date_hours?: number | null;
  start_date_minutes?: number | null;
  end_date_year?: number | null;
  end_date_month?: number | null;
  end_date_day?: number | null;
  end_date_hours?: number | null;
  end_date_minutes?: number | null;
  computed_start_date?: string | null;
  computed_end_date?: string | null;
}

export const SUB_EVENT_CALENDAR_MINIMUM_MARKER_MINUTES = 15;
export const SUB_EVENT_CALENDAR_TIME_BUFFER_HOURS = 5;

export interface SubEventCalendarSegment<T extends SubEventCalendarEvent> {
  key: string;
  event: T;
  eventId: string;
  title: string;
  columnKey: string;
  /** Wall-clock minute within columnKey in the parent event timezone. */
  startMinute: number;
  /** Actual wall-clock end minute; equals startMinute for a missing/invalid end. */
  endMinute: number;
  /** End used for collision and minimum-height layout without changing the displayed time. */
  layoutEndMinute: number;
  lane: number;
  laneCount: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  hasValidEnd: boolean;
  eventStartMinute: number;
  eventEndMinute: number | null;
  startTimestamp: number;
  endTimestamp: number | null;
}

export interface SubEventCalendarDate<T extends SubEventCalendarEvent> {
  key: string;
  segments: SubEventCalendarSegment<T>[];
}

export interface SubEventCalendarModel<T extends SubEventCalendarEvent> {
  timezone: string;
  dates: SubEventCalendarDate<T>[];
  segments: SubEventCalendarSegment<T>[];
  unscheduled: T[];
  startHour: number;
  endHour: number;
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface PendingSegment<T extends SubEventCalendarEvent> extends Omit<
  SubEventCalendarSegment<T>,
  'lane' | 'laneCount'
> {
  sourceIndex: number;
  segmentIndex: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && (value as number) >= minimum && (value as number) <= maximum;
}

function hasValidDate(year: unknown, month: unknown, day: unknown): boolean {
  if (
    !isIntegerInRange(year, 1, 9999) ||
    !isIntegerInRange(month, 1, 12) ||
    !isIntegerInRange(day, 1, 31)
  ) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function hasValidTime(hour: unknown, minute: unknown): boolean {
  return isIntegerInRange(hour, 0, 23) && isIntegerInRange(minute, 0, 59);
}

export function hasValidSubEventStart(event: SubEventCalendarEvent): boolean {
  return (
    hasValidDate(event.start_date_year, event.start_date_month, event.start_date_day) &&
    hasValidTime(event.start_date_hours, event.start_date_minutes)
  );
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(0);
    return true;
  } catch {
    return false;
  }
}

function resolveTimezone(timezone?: string | null, fallback = 'UTC'): string {
  return typeof timezone === 'string' && timezone.length > 0 && isValidTimezone(timezone)
    ? timezone
    : fallback;
}

function getFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timezone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timezone, formatter);
  return formatter;
}

function getParts(timestamp: number, timezone: string): DateTimeParts {
  const parts = getFormatter(timezone).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

function sameParts(left: DateTimeParts, right: DateTimeParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

/** Convert a civil time in an IANA timezone to an instant without relying on the viewer timezone. */
function localPartsToTimestamp(parts: DateTimeParts, timezone: string): number | null {
  const targetAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  let candidate = targetAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = getParts(candidate, timezone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute
    );
    const difference = targetAsUtc - observedAsUtc;
    if (difference === 0) {
      return candidate;
    }
    candidate += difference;
  }

  return sameParts(getParts(candidate, timezone), parts) ? candidate : null;
}

function parseTimestamp(value?: string | null): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getStartTimestamp(event: SubEventCalendarEvent, parentTimezone: string): number | null {
  if (!hasValidSubEventStart(event)) {
    return null;
  }

  const computed = parseTimestamp(event.computed_start_date);
  if (computed !== null) {
    return computed;
  }

  return localPartsToTimestamp(
    {
      year: event.start_date_year as number,
      month: event.start_date_month as number,
      day: event.start_date_day as number,
      hour: event.start_date_hours as number,
      minute: event.start_date_minutes as number,
    },
    resolveTimezone(event.timezone, parentTimezone)
  );
}

function getEndTimestamp(event: SubEventCalendarEvent, parentTimezone: string): number | null {
  const computed = parseTimestamp(event.computed_end_date);
  if (computed !== null) {
    return computed;
  }

  if (
    !hasValidDate(event.end_date_year, event.end_date_month, event.end_date_day) ||
    !hasValidTime(event.end_date_hours, event.end_date_minutes)
  ) {
    return null;
  }

  return localPartsToTimestamp(
    {
      year: event.end_date_year as number,
      month: event.end_date_month as number,
      day: event.end_date_day as number,
      hour: event.end_date_hours as number,
      minute: event.end_date_minutes as number,
    },
    resolveTimezone(event.timezone, parentTimezone)
  );
}

function toDateKey(parts: DateTimeParts): string {
  return `${parts.year.toString().padStart(4, '0')}-${parts.month
    .toString()
    .padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`;
}

function addCivilDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear().toString().padStart(4, '0')}-${(next.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}-${next.getUTCDate().toString().padStart(2, '0')}`;
}

function getDateKeys(startKey: string, endKey: string): string[] {
  const keys = [startKey];
  let current = startKey;

  while (current < endKey) {
    current = addCivilDay(current);
    keys.push(current);
  }

  return keys;
}

function buildPendingSegments<T extends SubEventCalendarEvent>(
  event: T,
  sourceIndex: number,
  startTimestamp: number,
  possibleEndTimestamp: number | null,
  timezone: string
): PendingSegment<T>[] {
  const startParts = getParts(startTimestamp, timezone);
  const startKey = toDateKey(startParts);
  const eventStartMinute = startParts.hour * 60 + startParts.minute;
  const hasValidEnd = possibleEndTimestamp !== null && possibleEndTimestamp > startTimestamp;
  const endTimestamp = hasValidEnd ? possibleEndTimestamp : null;
  const endParts = endTimestamp === null ? startParts : getParts(endTimestamp, timezone);
  const endKey = toDateKey(endParts);
  const eventEndMinute = endTimestamp === null ? null : endParts.hour * 60 + endParts.minute;
  const dateKeys = endTimestamp === null ? [startKey] : getDateKeys(startKey, endKey);

  const rawSegments = dateKeys.flatMap((columnKey, index) => {
    const isFirst = index === 0;
    const isLast = index === dateKeys.length - 1;
    const startMinute = isFirst ? eventStartMinute : 0;
    const endMinute =
      endTimestamp === null ? startMinute : isLast ? (eventEndMinute as number) : 1440;

    // An event ending exactly at midnight belongs to the preceding date only.
    if (!isFirst && isLast && endMinute === 0) {
      return [];
    }

    return [{ columnKey, startMinute, endMinute }];
  });

  return rawSegments.map((segment, segmentIndex) => ({
    key: `${event.id}:${segment.columnKey}:${segmentIndex}`,
    event,
    eventId: event.id,
    title: event.title,
    columnKey: segment.columnKey,
    startMinute: segment.startMinute,
    endMinute: segment.endMinute,
    layoutEndMinute: Math.min(
      1440,
      Math.max(segment.endMinute, segment.startMinute + SUB_EVENT_CALENDAR_MINIMUM_MARKER_MINUTES)
    ),
    continuesBefore: segmentIndex > 0,
    continuesAfter: segmentIndex < rawSegments.length - 1,
    hasValidEnd,
    eventStartMinute,
    eventEndMinute,
    startTimestamp,
    endTimestamp,
    sourceIndex,
    segmentIndex,
  }));
}

function comparePendingSegments<T extends SubEventCalendarEvent>(
  left: PendingSegment<T>,
  right: PendingSegment<T>
): number {
  return (
    left.columnKey.localeCompare(right.columnKey) ||
    left.startMinute - right.startMinute ||
    left.layoutEndMinute - right.layoutEndMinute ||
    left.eventId.localeCompare(right.eventId) ||
    left.segmentIndex - right.segmentIndex ||
    left.sourceIndex - right.sourceIndex
  );
}

function assignLanes<T extends SubEventCalendarEvent>(
  segments: PendingSegment<T>[]
): SubEventCalendarSegment<T>[] {
  const sorted = [...segments].sort(comparePendingSegments);
  const completed: SubEventCalendarSegment<T>[] = [];
  let cluster: PendingSegment<T>[] = [];
  let clusterEnd = -1;

  const completeCluster = () => {
    if (cluster.length === 0) {
      return;
    }

    const laneEnds: number[] = [];
    const assigned = cluster.map((segment) => {
      let lane = laneEnds.findIndex((end) => end <= segment.startMinute);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = segment.layoutEndMinute;
      return { segment, lane };
    });
    const laneCount = laneEnds.length;

    completed.push(
      ...assigned.map(({ segment, lane }) => {
        const {
          sourceIndex: _sourceIndex,
          segmentIndex: _segmentIndex,
          ...publicSegment
        } = segment;
        return { ...publicSegment, lane, laneCount };
      })
    );
    cluster = [];
    clusterEnd = -1;
  };

  for (const segment of sorted) {
    if (cluster.length > 0 && segment.startMinute >= clusterEnd) {
      completeCluster();
    }
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.layoutEndMinute);
  }
  completeCluster();

  return completed;
}

export function buildSubEventCalendar<T extends SubEventCalendarEvent>(
  events: readonly T[],
  parentTimezone: string
): SubEventCalendarModel<T> {
  const timezone = resolveTimezone(parentTimezone);
  const unscheduled: T[] = [];
  const pendingByDate = new Map<string, PendingSegment<T>[]>();

  events.forEach((event, sourceIndex) => {
    const startTimestamp = getStartTimestamp(event, timezone);
    if (startTimestamp === null) {
      unscheduled.push(event);
      return;
    }

    const segments = buildPendingSegments(
      event,
      sourceIndex,
      startTimestamp,
      getEndTimestamp(event, timezone),
      timezone
    );
    for (const segment of segments) {
      const existing = pendingByDate.get(segment.columnKey) ?? [];
      existing.push(segment);
      pendingByDate.set(segment.columnKey, existing);
    }
  });

  const dates = [...pendingByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, pending]) => ({ key, segments: assignLanes(pending) }));
  const segments = dates.flatMap((date) => date.segments);

  if (segments.length === 0) {
    return { timezone, dates, segments, unscheduled, startHour: 0, endHour: 24 };
  }

  const earliestMinute = Math.min(...segments.map((segment) => segment.startMinute));
  const latestMinute = Math.max(...segments.map((segment) => segment.layoutEndMinute));
  const startHour = Math.max(
    0,
    Math.floor(earliestMinute / 60) - SUB_EVENT_CALENDAR_TIME_BUFFER_HOURS
  );
  const endHour = Math.min(
    24,
    Math.max(startHour + 1, Math.ceil(latestMinute / 60) + SUB_EVENT_CALENDAR_TIME_BUFFER_HOURS)
  );

  return { timezone, dates, segments, unscheduled, startHour, endHour };
}
