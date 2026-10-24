'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { EventWithUser } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface DiscoverEventCardProps {
  event: EventWithUser;
  className?: string;
}

function getEventPlace(event: EventWithUser): string | null {
  const city = event.event_locations?.city?.trim();
  if (city) return city;

  const location = event.location?.trim();
  return location || null;
}

export function DiscoverEventCard({ event, className }: DiscoverEventCardProps) {
  const { dayOfWeek, monthShort, dayOfMonth, timeWithTz } = formatEventDateFromParts({
    year: event.start_date_year,
    month: event.start_date_month,
    day: event.start_date_day,
    hours: event.start_date_hours,
    minutes: event.start_date_minutes,
    timezone: event.timezone,
    fallbackIso: event.computed_start_date,
  });

  const coverSrc =
    event.cover && isGif(event.cover) ? event.cover : getEventCoverDisplayUrl(event.cover, 'feed');
  const host = event.user_details;
  const hostHandle = host?.username || host?.name;
  const place = getEventPlace(event);
  const price = event.cost && Number(event.cost) > 0 ? `$${Number(event.cost)}` : null;
  const timeLine = [dayOfWeek, timeWithTz].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/e/${event.id}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60 dark:hover:shadow-none dark:focus-visible:ring-offset-neutral-900',
        className
      )}
    >
      <div className='relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-neutral-800'>
        <Image
          src={coverSrc}
          alt={event.title}
          fill
          sizes='(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw'
          className='object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]'
        />

        {dayOfMonth && monthShort && (
          <div className='absolute left-3 top-3 flex min-w-[44px] flex-col items-center rounded-xl bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90'>
            <span className='text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400'>
              {monthShort}
            </span>
            <span className='text-lg font-bold leading-tight text-gray-900 dark:text-neutral-100'>
              {dayOfMonth}
            </span>
          </div>
        )}

        {price && (
          <span className='absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-100'>
            {price}
          </span>
        )}
      </div>

      <div className='flex flex-1 flex-col gap-1.5 p-3.5'>
        {timeLine && (
          <p className='text-xs font-medium text-red-500 dark:text-red-400'>{timeLine}</p>
        )}

        <h3 className='line-clamp-2 text-base font-semibold leading-snug text-gray-900 dark:text-neutral-100'>
          {event.title}
        </h3>

        <div className='mt-auto flex min-w-0 items-center gap-1.5 pt-1 text-sm text-gray-500 dark:text-neutral-400'>
          {hostHandle && (
            <>
              <UserAvatar
                user={{
                  name: host?.name || undefined,
                  username: host?.username || undefined,
                  image: host?.image || undefined,
                  verification_status: host?.verification_status || null,
                }}
                size='xs'
                className='shrink-0'
              />
              <span className='min-w-0 truncate font-medium text-gray-700 dark:text-neutral-300'>
                @{hostHandle}
              </span>
            </>
          )}

          {place && (
            <>
              {hostHandle && (
                <span aria-hidden='true' className='text-gray-300 dark:text-neutral-600'>
                  ·
                </span>
              )}
              <MapPin className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
              <span className='min-w-0 truncate'>{place}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DiscoverEventCardSkeleton() {
  return (
    <div
      aria-hidden='true'
      className='flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
    >
      <div className='aspect-[4/3] w-full animate-pulse bg-gray-100 dark:bg-neutral-800' />
      <div className='flex flex-col gap-2 p-3.5'>
        <div className='h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
        <div className='h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
        <div className='h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
        <div className='mt-1 flex items-center gap-2'>
          <div className='h-5 w-5 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700' />
          <div className='h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
        </div>
      </div>
    </div>
  );
}
