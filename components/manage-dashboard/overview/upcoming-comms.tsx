'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { EVENT_REMINDER_OFFSET_LABELS, type EventReminderOffset } from '@/lib/types/api';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { Bell, ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';

interface UpcomingCommsProps {
  dashboard: EventDashboard;
}

type ReminderState = 'sent' | 'past' | 'upcoming' | 'unscheduled';

const OFFSET_UNIT_MS: Record<string, number> = { h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function offsetToMs(offset: string): number | null {
  const match = /^(\d+)([hd])$/.exec(offset);
  return match ? Number(match[1]) * OFFSET_UNIT_MS[match[2]] : null;
}

function formatDateTime(value: string | number, timeZone: string | null) {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  try {
    return new Intl.DateTimeFormat(undefined, {
      ...options,
      timeZone: timeZone ?? undefined,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(new Date(value));
  }
}

const STATE_BADGE: Record<ReminderState, { label: string; className: string }> = {
  sent: {
    label: 'Sent',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
  },
  past: {
    label: 'Passed',
    className: 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  upcoming: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  },
  unscheduled: {
    label: 'Needs date',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  },
};

export function UpcomingComms({ dashboard }: UpcomingCommsProps) {
  const { event, communications } = dashboard;
  const base = `/e/${event.id}/manage`;
  const { blasts, reminders } = communications;
  const startMs = event.computed_start_date ? new Date(event.computed_start_date).getTime() : null;
  const now = Date.now();

  const reminderRows = reminders.offsets
    .map((offset) => {
      const offsetMs = offsetToMs(offset);
      const sendAt = startMs !== null && offsetMs !== null ? startMs - offsetMs : null;
      const state: ReminderState = reminders.sent.includes(offset)
        ? 'sent'
        : sendAt === null
          ? 'unscheduled'
          : sendAt <= now
            ? 'past'
            : 'upcoming';
      const label =
        offset in EVENT_REMINDER_OFFSET_LABELS
          ? EVENT_REMINDER_OFFSET_LABELS[offset as EventReminderOffset]
          : `${offset} before`;
      return { offset, sendAt, state, label };
    })
    .sort((a, b) => (a.sendAt ?? Number.MAX_SAFE_INTEGER) - (b.sendAt ?? Number.MAX_SAFE_INTEGER));

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <h2 className='mb-3 text-base font-semibold text-gray-900 dark:text-neutral-100'>
        Upcoming communications
      </h2>

      <Link
        href={`${base}/email-blast`}
        className='flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'>
          <Mail className='h-4 w-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium text-gray-900 dark:text-neutral-100'>
            {blasts.nextScheduledFor ? 'Next email blast' : 'No blasts scheduled'}
          </span>
          <span className='block truncate text-xs text-gray-500 dark:text-neutral-400'>
            {blasts.nextScheduledFor
              ? `${formatDateTime(blasts.nextScheduledFor, event.timezone)}${
                  blasts.scheduled > 1 ? ` · ${blasts.scheduled - 1} more scheduled` : ''
                }`
              : `${blasts.completed} sent${blasts.failed > 0 ? ` · ${blasts.failed} failed` : ''}`}
          </span>
        </span>
        <ChevronRight className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
      </Link>

      <div className='my-2 border-t border-gray-100 dark:border-neutral-800' />

      <Link
        href={`${base}/reminders`}
        className='flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
      >
        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'>
          <Bell className='h-4 w-4' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-medium text-gray-900 dark:text-neutral-100'>
            Guest reminders
          </span>
          <span className='block truncate text-xs text-gray-500 dark:text-neutral-400'>
            {reminderRows.length > 0
              ? `${reminderRows.length} configured`
              : 'No reminders configured'}
          </span>
        </span>
        <ChevronRight className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
      </Link>

      {reminderRows.length > 0 && (
        <ul className='mt-1 space-y-1 pl-12 pr-2'>
          {reminderRows.map((row) => (
            <li key={row.offset} className='flex items-center justify-between gap-2 py-1'>
              <span className='min-w-0'>
                <span
                  className={cn(
                    'block truncate text-sm',
                    row.state === 'past'
                      ? 'text-gray-400 dark:text-neutral-500'
                      : 'text-gray-900 dark:text-neutral-100'
                  )}
                >
                  {row.label}
                </span>
                {row.sendAt !== null && (
                  <span className='block truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {formatDateTime(row.sendAt, event.timezone)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  STATE_BADGE[row.state].className
                )}
              >
                {STATE_BADGE[row.state].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function UpcomingCommsSkeleton() {
  return (
    <div className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <Skeleton className='h-5 w-44' />
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className='flex items-center gap-3 px-2 py-1'>
          <Skeleton className='h-8 w-8 rounded-lg' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-40' />
          </div>
        </div>
      ))}
    </div>
  );
}
