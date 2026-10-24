'use client';

import { EventWithUser } from '@/lib/types/api';
import { buildSubEventCalendar } from '@/lib/utils/sub-event-calendar';
import { CalendarDays, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { EventCompactItem } from '../event-compact-item';
import { Button } from '../ui/button';
import { EventSection } from './event-section';
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
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
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
    <EventSection
      title={t('subEvents.title')}
      variant='plain'
      action={
        <>
          {hasCalendar && !subEventsLoading && (
            <Button type='button' variant='outline' size='sm' onClick={() => setCalendarOpen(true)}>
              <CalendarDays className='h-4 w-4' />
              {t('subEvents.viewCalendar')}
            </Button>
          )}
          {isHost && (
            <Button
              variant='secondary'
              size='icon'
              className='h-9 w-9'
              aria-label={t('subEvents.manage')}
              onClick={() => router.push(`/e/${eventId}/manage/sub-events`)}
            >
              <PlusIcon className='h-4 w-4' />
            </Button>
          )}
        </>
      }
    >
      <div className='space-y-4'>
        {subEventsLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
              >
                <div className='flex items-start gap-3'>
                  <div className='h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-neutral-700' />
                  <div className='flex-1'>
                    <div className='h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
                    <div className='mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
                    <div className='mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
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
                  className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-neutral-900 dark:via-neutral-900/90'
                />
              )}
            </div>
            {hasMoreSubEvents && (
              <Button
                type='button'
                variant='outline'
                className='h-10 w-full rounded-xl bg-gray-50 dark:bg-neutral-800'
                onClick={() => setIsExpanded((expanded) => !expanded)}
              >
                {isExpanded ? tCommon('actions.showLess') : tCommon('actions.viewAll')}
              </Button>
            )}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-800/40'>
            <p className='text-sm text-gray-500 dark:text-neutral-500'>{t('subEvents.empty')}</p>
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
    </EventSection>
  );
}
