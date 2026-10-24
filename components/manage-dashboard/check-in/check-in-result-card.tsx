'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import type { CheckInResult } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';

export type CheckInResultTone = 'success' | 'already-used' | 'invalid';

export function getCheckInResultTone(result: CheckInResult): CheckInResultTone {
  if (result.valid) return 'success';
  if (result.alreadyUsed) return 'already-used';
  return 'invalid';
}

/**
 * Formats a check-in timestamp as a short time for today ("7:42 PM"),
 * or with the day for anything older ("Oct 21, 7:42 PM").
 */
export function formatCheckInTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
}

const toneStyles: Record<
  CheckInResultTone,
  { container: string; iconWrap: string; icon: string; title: string; body: string }
> = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-900/60',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    body: 'text-emerald-700 dark:text-emerald-300',
  },
  'already-used': {
    container: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40',
    iconWrap: 'bg-amber-100 dark:bg-amber-900/60',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    body: 'text-amber-700 dark:text-amber-300',
  },
  invalid: {
    container: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40',
    iconWrap: 'bg-red-100 dark:bg-red-900/60',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    body: 'text-red-700 dark:text-red-300',
  },
};

const toneIcons = {
  success: CheckCircle2,
  'already-used': AlertTriangle,
  invalid: XCircle,
} as const;

const toneTitles: Record<CheckInResultTone, string> = {
  success: 'Checked in',
  'already-used': 'Already checked in',
  invalid: 'Invalid ticket',
};

interface CheckInResultCardProps {
  result: CheckInResult;
  onDismiss?: () => void;
  className?: string;
}

export function CheckInResultCard({ result, onDismiss, className }: CheckInResultCardProps) {
  const tone = getCheckInResultTone(result);
  const styles = toneStyles[tone];
  const Icon = toneIcons[tone];
  const checkedInTime = result.checkedInAt ? formatCheckInTime(result.checkedInAt) : '';
  const attendeeName = result.attendee?.name || 'Guest';

  let description: string;
  if (tone === 'success') {
    description = checkedInTime ? `Welcome in · ${checkedInTime}` : 'Welcome in';
  } else if (tone === 'already-used') {
    description = checkedInTime
      ? `This ticket was already used at ${checkedInTime}`
      : 'This ticket was already used';
  } else {
    description = result.error || 'This ticket could not be verified for this event.';
  }

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn('relative rounded-2xl border p-4', styles.container, className)}
    >
      {onDismiss ? (
        <button
          type='button'
          onClick={onDismiss}
          className='absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10'
          aria-label='Dismiss result'
        >
          <X className='h-4 w-4' />
        </button>
      ) : null}

      <div className='flex items-start gap-3 pr-6'>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            styles.iconWrap
          )}
        >
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        <div className='min-w-0 flex-1'>
          <p className={cn('text-base font-semibold', styles.title)}>{toneTitles[tone]}</p>
          <p className={cn('mt-0.5 text-sm', styles.body)}>{description}</p>
        </div>
      </div>

      {result.attendee ? (
        <div className='mt-4 flex items-center gap-3 rounded-xl bg-white/70 p-3 dark:bg-neutral-900/70'>
          <UserAvatar size='base' user={{ name: attendeeName, image: result.attendee.image }} />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {attendeeName}
            </p>
            {result.ticketType ? (
              <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                {result.ticketType}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
