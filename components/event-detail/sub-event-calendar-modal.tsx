'use client';

import { Modal } from '@/components/ui/modal';
import type { EventWithUser } from '@/lib/types/api';
import {
  type SubEventCalendarModel,
  type SubEventCalendarSegment,
} from '@/lib/utils/sub-event-calendar';
import { formatTimezoneDisplay } from '@/lib/utils/timezone';
import { Clock3 } from 'lucide-react';

const HOUR_HEIGHT_PX = 72;
const DATE_COLUMN_WIDTH_PX = 224;
const TIME_RAIL_WIDTH_PX = 64;

interface SubEventCalendarModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  calendar: SubEventCalendarModel<EventWithUser>;
  onSelectEvent: (eventId: string) => void;
}

function formatDateKey(dateKey: string): { weekday: string; date: string } {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  return {
    weekday: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(date),
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  };
}

function formatAccessibleDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

function formatMinute(minute: number): string {
  const normalizedMinute = minute === 1440 ? 0 : minute;
  const hours = Math.floor(normalizedMinute / 60);
  const minutes = normalizedMinute % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getEventTimeLabel(segment: SubEventCalendarSegment<EventWithUser>): string {
  const start = formatMinute(segment.eventStartMinute);
  if (!segment.hasValidEnd || segment.eventEndMinute === null) {
    return start;
  }
  return `${start}–${formatMinute(segment.eventEndMinute)}`;
}

function EventBlock({
  segment,
  startHour,
  onSelectEvent,
}: {
  segment: SubEventCalendarSegment<EventWithUser>;
  startHour: number;
  onSelectEvent: (eventId: string) => void;
}) {
  const pixelsPerMinute = HOUR_HEIGHT_PX / 60;
  const top = (segment.startMinute - startHour * 60) * pixelsPerMinute;
  const height = Math.max(18, (segment.layoutEndMinute - segment.startMinute) * pixelsPerMinute);
  const laneWidth = 100 / segment.laneCount;
  const left = segment.lane * laneWidth;
  const timeLabel = getEventTimeLabel(segment);
  const dateLabel = formatAccessibleDateKey(segment.columnKey);
  const continuationLabel = [
    segment.continuesBefore ? 'Continues from the previous day.' : '',
    segment.continuesAfter ? 'Continues into the next day.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type='button'
      aria-label={`${segment.title}, ${dateLabel}, ${timeLabel}. ${continuationLabel}`.trim()}
      title={`${segment.title} · ${timeLabel}`}
      className='absolute overflow-hidden rounded-2xl border border-gray-900/10 bg-gray-900 px-2 py-1 text-left text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
      style={{
        top,
        height,
        left: `calc(${left}% + 2px)`,
        width: `calc(${laneWidth}% - 4px)`,
      }}
      onClick={() => onSelectEvent(segment.eventId)}
    >
      <span className='block truncate text-xs font-semibold leading-4'>{segment.title}</span>
      {height >= 40 && (
        <span className='block truncate text-[10px] text-gray-300'>{timeLabel}</span>
      )}
    </button>
  );
}

export function SubEventCalendarModal({
  open,
  setOpen,
  calendar: model,
  onSelectEvent,
}: SubEventCalendarModalProps) {
  const hourCount = model.endHour - model.startHour;
  const gridHeight = hourCount * HOUR_HEIGHT_PX;
  const hourMarkers = Array.from({ length: hourCount + 1 }, (_, index) => model.startHour + index);
  const timezoneLabel = formatTimezoneDisplay(model.timezone) || model.timezone;
  const canvasWidth = TIME_RAIL_WIDTH_PX + model.dates.length * DATE_COLUMN_WIDTH_PX;

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title='Sub-Events Calendar'
      description={`All times in ${timezoneLabel}`}
      isWideDialog
      isMobileFullScreen
      actionCloseButton
      mobileHandleOnly
      dialogContentClassName='h-[min(86dvh,820px)] w-[calc(100vw-3rem)] min-w-0 max-w-6xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl sm:rounded-3xl'
      drawerContentClassName='mt-0 h-[100dvh] max-h-[100dvh] min-h-0 rounded-t-3xl border-0'
    >
      <div
        className='flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]'
        data-testid='sub-event-calendar-content'
        data-vaul-no-drag
      >
        <div
          className='min-h-0 flex-1 overflow-auto overscroll-contain border-y border-gray-200 bg-white [-webkit-overflow-scrolling:touch] [touch-action:pan-x_pan-y]'
          data-testid='sub-event-calendar-grid'
        >
          <div className='w-full' style={{ minWidth: canvasWidth }}>
            <div className='sticky top-0 z-30 flex h-16 border-b border-gray-200 bg-white'>
              <div
                className='sticky left-0 z-30 shrink-0 border-r border-gray-200 bg-white'
                style={{ width: TIME_RAIL_WIDTH_PX }}
              />
              {model.dates.map((date) => {
                const label = formatDateKey(date.key);
                return (
                  <div
                    key={date.key}
                    className='flex min-w-0 flex-1 shrink-0 flex-col items-center justify-center border-r border-gray-200 bg-white px-3'
                    style={{ minWidth: DATE_COLUMN_WIDTH_PX }}
                  >
                    <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                      {label.weekday}
                    </span>
                    <span className='text-sm font-semibold text-gray-900'>{label.date}</span>
                  </div>
                );
              })}
            </div>

            <div className='flex'>
              <div
                className='sticky left-0 z-10 shrink-0 border-r border-gray-200 bg-white'
                style={{ width: TIME_RAIL_WIDTH_PX, height: gridHeight }}
              >
                {hourMarkers.slice(0, -1).map((hour, index) => (
                  <span
                    key={`${hour}-${index}`}
                    className='absolute right-2 -translate-y-2 text-[10px] font-medium text-gray-500'
                    style={{ top: index * HOUR_HEIGHT_PX }}
                  >
                    {formatMinute((hour % 24) * 60)}
                  </span>
                ))}
              </div>

              {model.dates.map((date) => (
                <div
                  key={date.key}
                  className='relative min-w-0 flex-1 shrink-0 border-r border-gray-200 bg-white'
                  style={{ minWidth: DATE_COLUMN_WIDTH_PX, height: gridHeight }}
                >
                  {hourMarkers.map((hour, index) => (
                    <div
                      key={`${hour}-${index}`}
                      aria-hidden='true'
                      className='pointer-events-none absolute inset-x-0 border-t border-gray-100'
                      style={{ top: index * HOUR_HEIGHT_PX }}
                    />
                  ))}
                  {date.segments.map((segment) => (
                    <EventBlock
                      key={segment.key}
                      segment={segment}
                      startHour={model.startHour}
                      onSelectEvent={onSelectEvent}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {model.unscheduled.length > 0 && (
          <div className='shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3'>
            <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900'>
              <Clock3 className='h-4 w-4 text-gray-500' />
              Time TBD
            </div>
            <div className='flex gap-2 overflow-x-auto pb-1'>
              {model.unscheduled.map((event) => (
                <button
                  key={event.id}
                  type='button'
                  aria-label={`${event.title}, time to be determined`}
                  className='max-w-56 shrink-0 truncate rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  onClick={() => onSelectEvent(event.id)}
                >
                  {event.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
