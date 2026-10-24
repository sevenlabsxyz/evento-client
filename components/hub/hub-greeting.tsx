'use client';

import { Button } from '@/components/ui/button';
import { EventWithUser, UserDetails } from '@/lib/types/api';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface HubGreetingProps {
  viewer: UserDetails | null;
  upcomingEvents: EventWithUser[];
  upcomingTotalCount: number | null;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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

function getSummary(events: EventWithUser[], upcomingTotalCount: number | null, now: Date): string {
  const thisWeek = countEventsThisWeek(events, now);
  if (thisWeek > 0) {
    return `${thisWeek} ${thisWeek === 1 ? 'event' : 'events'} this week`;
  }

  const upcoming = Math.max(upcomingTotalCount ?? 0, events.length);
  if (upcoming > 0) {
    return `Nothing on your calendar this week · ${upcoming} upcoming`;
  }

  return 'Nothing on your calendar this week';
}

export function HubGreeting({ viewer, upcomingEvents, upcomingTotalCount }: HubGreetingProps) {
  const now = new Date();
  const firstName = getFirstName(viewer);
  const greeting = getGreeting(now.getHours());
  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const summary = getSummary(upcomingEvents, upcomingTotalCount, now);

  return (
    <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
      <div className='min-w-0 space-y-1'>
        <p className='text-sm font-medium text-gray-500 dark:text-neutral-400'>{todayLabel}</p>
        <h1 className='truncate text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100 md:text-3xl'>
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className='text-sm text-gray-600 dark:text-neutral-300'>{summary}</p>
      </div>
      <div className='flex shrink-0 gap-2'>
        <Button asChild variant='outline' className='flex-1 md:flex-none'>
          <Link href='/e/search'>
            <Search />
            Find events
          </Link>
        </Button>
        <Button asChild className='flex-1 md:flex-none'>
          <Link href='/e/create'>
            <Plus />
            Create
          </Link>
        </Button>
      </div>
    </header>
  );
}
