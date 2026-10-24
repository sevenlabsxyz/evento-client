'use client';

import { Button } from '@/components/ui/button';
import { EventWithUser, UserDetails } from '@/lib/types/api';
import { Plus, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

import { getIntlLocale } from '@/lib/i18n/active-locale';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface HubGreetingProps {
  viewer: UserDetails | null;
  upcomingEvents: EventWithUser[];
  upcomingTotalCount: number | null;
}

type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getFirstName(viewer: UserDetails | null): string {
  const firstName = viewer?.name?.trim().split(/\s+/)[0];
  return firstName || viewer?.username || '';
}

function countEventsThisWeek(events: EventWithUser[], now: Date): number {
  const nowMs = now.getTime();
  const weekEndMs = nowMs + WEEK_MS;

  return events.filter((event) => {
    const startMs = new Date(event.computed_start_date).getTime();
    if (Number.isNaN(startMs) || startMs > weekEndMs) return false;

    const endMs = new Date(event.computed_end_date).getTime();
    return (Number.isNaN(endMs) ? startMs : endMs) >= nowMs;
  }).length;
}

type SummaryKey = 'eventsThisWeek' | 'nothingThisWeekUpcoming' | 'nothingThisWeek';

function getSummary(
  events: EventWithUser[],
  upcomingTotalCount: number | null,
  now: Date
): { key: SummaryKey; count: number } {
  const thisWeek = countEventsThisWeek(events, now);
  if (thisWeek > 0) {
    return { key: 'eventsThisWeek', count: thisWeek };
  }

  const upcoming = Math.max(upcomingTotalCount ?? 0, events.length);
  if (upcoming > 0) {
    return { key: 'nothingThisWeekUpcoming', count: upcoming };
  }

  return { key: 'nothingThisWeek', count: 0 };
}

export function HubGreeting({ viewer, upcomingEvents, upcomingTotalCount }: HubGreetingProps) {
  const t = useTranslations('hub');
  const locale = useLocale();
  const now = new Date();
  const firstName = getFirstName(viewer);
  const period = getGreetingPeriod(now.getHours());
  const todayLabel = now.toLocaleDateString(getIntlLocale(locale), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const summaryParts = getSummary(upcomingEvents, upcomingTotalCount, now);
  const summary = t(`greeting.${summaryParts.key}`, { count: summaryParts.count });

  return (
    <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
      <div className='min-w-0 space-y-1'>
        <p className='text-sm font-medium text-gray-500 dark:text-neutral-400'>{todayLabel}</p>
        <h1 className='truncate text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100 md:text-3xl'>
          {firstName ? t(`greeting.${period}Name`, { name: firstName }) : t(`greeting.${period}`)}
        </h1>
        <p className='text-sm text-gray-600 dark:text-neutral-300'>{summary}</p>
      </div>
      <div className='flex shrink-0 gap-2'>
        <Button asChild variant='outline' className='flex-1 md:flex-none'>
          <Link href='/e/search'>
            <Search />
            {t('greeting.findEvents')}
          </Link>
        </Button>
        <Button asChild className='flex-1 md:flex-none'>
          <Link href='/e/create'>
            <Plus />
            {t('greeting.create')}
          </Link>
        </Button>
      </div>
    </header>
  );
}
