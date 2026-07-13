'use client';

import { EventWithUser } from '@/lib/types/api';
import { buildSubEventCalendar } from '@/lib/utils/sub-event-calendar';
import { CalendarDays, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { EventCompactItem } from '../event-compact-item';
import { Button } from '../ui/button';
import { SubEventCalendarModal } from './sub-event-calendar-modal';

const COLLAPSED_SUB_EVENT_COUNT = 4;

interface EventSubEventsProps {
  eventId: string;
  isHost?: boolean;
  parentTimezone: string;
  subEvents: EventWithUser[];
  subEventsLoading: boolean;
  subEventsError: Error | null;
}

export default function EventSubEvents({
  eventId,
  isHost = false,
  parentTimezone,
  subEvents,
  subEventsLoading,
  subEventsError,
}: EventSubEventsProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendar = useMemo(
    () => buildSubEventCalendar(subEvents, parentTimezone),
    [parentTimezone, subEvents]
  );
  const hasMoreSubEvents = subEvents.length > COLLAPSED_SUB_EVENT_COUNT;
  const visibleSubEvents =
    isExpanded || !hasMoreSubEvents ? subEvents : subEvents.slice(0, COLLAPSED_SUB_EVENT_COUNT);
  const hasCalendar = calendar.segments.length > 0;

  const handleCalendarEventSelect = (subEventId: string) => {
    setCalendarOpen(false);
    router.push(`/e/${subEventId}`);
  };

  if (subEventsError) return null;

  return (
    <div className='space-y-4 border-t border-gray-100 pt-6'>
      <div className='mb-4 flex items-center justify-between gap-2'>
        <h3 className='min-w-0 text-lg font-semibold text-gray-900'>Sub Events</h3>
        <div className='flex shrink-0 items-center gap-2'>
          {hasCalendar && !subEventsLoading && (
            <Button type='button' variant='outline' size='sm' onClick={() => setCalendarOpen(true)}>
              <CalendarDays className='h-4 w-4' />
              View Calendar
            </Button>
          )}
          {isHost && (
            <Button
              variant='secondary'
              size='icon'
              className='h-9 w-9'
              aria-label='Manage sub events'
              onClick={() => router.push(`/e/${eventId}/manage/sub-events`)}
            >
              <PlusIcon className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
      <div className='space-y-4'>
        {subEventsLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className='rounded-lg border p-4'>
                <div className='flex items-start gap-3'>
                  <div className='h-12 w-12 animate-pulse rounded-lg bg-gray-200' />
                  <div className='flex-1'>
                    <div className='h-4 w-3/4 animate-pulse rounded bg-gray-200' />
                    <div className='mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200' />
                    <div className='mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subEvents.length > 0 ? (
          <div className='space-y-4'>
            <div className='relative'>
              <div className='space-y-3'>
                {visibleSubEvents.map((subEvent) => (
                  <EventCompactItem key={subEvent.id} event={subEvent} variant='sub-event' />
                ))}
              </div>
              {!isExpanded && hasMoreSubEvents && (
                <div
                  aria-hidden='true'
                  className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent'
                />
              )}
            </div>
            {hasMoreSubEvents && (
              <Button
                type='button'
                variant='outline'
                className='h-12 w-full bg-gray-50'
                onClick={() => setIsExpanded((expanded) => !expanded)}
              >
                {isExpanded ? 'Show less' : 'View all'}
              </Button>
            )}
          </div>
        ) : (
          <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
            <p className='text-sm text-gray-500'>No sub events found.</p>
          </div>
        )}
      </div>
      {hasCalendar && (
        <SubEventCalendarModal
          open={calendarOpen}
          setOpen={setCalendarOpen}
          calendar={calendar}
          onSelectEvent={handleCalendarEventSelect}
        />
      )}
    </div>
  );
}
