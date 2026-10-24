'use client';

import { Button } from '@/components/ui/button';
import { EventWithUser } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { CalendarDays, CalendarPlus, MapPin, Navigation, Settings2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;
const COUNTDOWN_REFRESH_MS = 60 * 1000;
const relativeTimeFormat = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

interface UpNextCardProps {
  event: EventWithUser | null;
  isHost: boolean;
}

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

function getCalendarDayInTimeZone(date: Date, timezone?: string): CalendarDay {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || undefined,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read('year'), month: read('month'), day: read('day') };
}

function getEventStartDay(event: EventWithUser, start: Date): CalendarDay {
  if (event.start_date_year && event.start_date_month && event.start_date_day) {
    return {
      year: event.start_date_year,
      month: event.start_date_month,
      day: event.start_date_day,
    };
  }

  return getCalendarDayInTimeZone(start, event.timezone);
}

function toDayNumber({ year, month, day }: CalendarDay): number {
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function getCountdownLabel(event: EventWithUser, time: string, now: Date): string {
  const start = new Date(event.computed_start_date);
  if (Number.isNaN(start.getTime())) {
    return '';
  }

  const end = new Date(event.computed_end_date);
  const hasEnd = !Number.isNaN(end.getTime());
  if (start <= now && (!hasEnd || now < end)) {
    return 'Happening now';
  }

  const dayDiff =
    toDayNumber(getEventStartDay(event, start)) -
    toDayNumber(getCalendarDayInTimeZone(now, event.timezone));

  if (dayDiff <= 0) {
    return time ? `Today ${time}` : 'Today';
  }
  if (dayDiff === 1) {
    return time ? `Tomorrow ${time}` : 'Tomorrow';
  }
  if (dayDiff < 14) {
    return relativeTimeFormat.format(dayDiff, 'day');
  }
  if (dayDiff < 60) {
    return relativeTimeFormat.format(Math.round(dayDiff / 7), 'week');
  }
  if (dayDiff < 365) {
    return relativeTimeFormat.format(Math.round(dayDiff / 30), 'month');
  }
  return relativeTimeFormat.format(Math.round(dayDiff / 365), 'year');
}

function getDirectionsUrl(event: EventWithUser): string | null {
  const location = event.event_locations;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const hasCoordinates =
    latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  const destination = hasCoordinates ? `${latitude},${longitude}` : event.location?.trim();
  if (!destination || destination === 'TBD' || /^https?:\/\//i.test(destination)) {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), COUNTDOWN_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export function UpNextCard({ event, isHost }: UpNextCardProps) {
  const now = useNow();

  if (!event) {
    return (
      <section
        aria-label='Up next'
        className='flex items-center gap-3 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-950'
      >
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300'>
          <CalendarPlus className='h-5 w-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            No upcoming events
          </p>
          <button
            type='button'
            onClick={() =>
              document
                .getElementById('discover')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className='text-sm font-medium text-red-600 hover:underline dark:text-red-400'
          >
            Browse what&apos;s on
          </button>
        </div>
      </section>
    );
  }

  const { longDate, timeWithTz } = formatEventDateFromParts({
    year: event.start_date_year,
    month: event.start_date_month,
    day: event.start_date_day,
    hours: event.start_date_hours,
    minutes: event.start_date_minutes,
    timezone: event.timezone,
    fallbackIso: event.computed_start_date,
  });
  const countdown = getCountdownLabel(event, timeWithTz, now);
  const isLive = countdown === 'Happening now';
  const dateLine = [longDate, timeWithTz].filter(Boolean).join(' · ');
  const directionsUrl = getDirectionsUrl(event);
  const coverImage =
    event.cover && isGif(event.cover) ? event.cover : getEventCoverDisplayUrl(event.cover, 'feed');
  const eventHref = `/e/${event.id}`;

  return (
    <section
      aria-label='Up next'
      className='overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
    >
      <Link
        href={eventHref}
        className='relative block aspect-[16/9] w-full bg-gray-100 dark:bg-neutral-800'
      >
        <Image
          src={coverImage}
          alt={event.title}
          fill
          sizes='(min-width: 1024px) 320px, 100vw'
          className='object-cover'
        />
        {countdown && (
          <span
            className={cn(
              'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur',
              isLive
                ? 'bg-red-600 text-white'
                : 'bg-white/90 text-gray-900 dark:bg-neutral-900/90 dark:text-neutral-100'
            )}
          >
            {isLive && <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-white' />}
            {countdown}
          </span>
        )}
      </Link>

      <div className='space-y-3 p-4'>
        <div className='space-y-1'>
          <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
            Up next
          </p>
          <Link href={eventHref} className='block'>
            <h3 className='line-clamp-2 text-lg font-semibold leading-tight text-gray-900 hover:underline dark:text-neutral-100'>
              {event.title}
            </h3>
          </Link>
        </div>

        <div className='space-y-1.5 text-sm text-gray-600 dark:text-neutral-300'>
          {dateLine && (
            <p className='flex items-center gap-2'>
              <CalendarDays className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
              <span className='truncate'>{dateLine}</span>
            </p>
          )}
          {event.location && (
            <p className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
              <span className='truncate'>{event.location}</span>
            </p>
          )}
        </div>

        <div className='flex gap-2'>
          <Button asChild size='sm' className='flex-1'>
            <Link href={eventHref}>View</Link>
          </Button>
          {isHost && (
            <Button asChild size='sm' variant='outline' className='flex-1'>
              <Link href={`/e/${event.id}/manage`}>
                <Settings2 />
                Manage
              </Link>
            </Button>
          )}
          {directionsUrl && (
            <Button
              asChild
              size='sm'
              variant='outline'
              className={cn(isHost ? 'w-9 px-0' : 'flex-1')}
            >
              <a
                href={directionsUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Directions'
                title='Directions'
              >
                <Navigation />
                {!isHost && 'Directions'}
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
