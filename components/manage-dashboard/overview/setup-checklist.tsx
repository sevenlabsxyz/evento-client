'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { Translator } from '@/lib/i18n/types';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, PartyPopper } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface SetupChecklistProps {
  dashboard: EventDashboard;
  onInviteGuests: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  onClick?: () => void;
  hint?: string;
}

type ManageT = Translator<'manage'>;

function buildChecklist(
  dashboard: EventDashboard,
  onInviteGuests: () => void,
  t: ManageT
): ChecklistItem[] {
  const { event, registration, tickets, communications, invites, rsvps } = dashboard;
  const base = `/e/${event.id}/manage`;
  const items: ChecklistItem[] = [
    {
      id: 'cover',
      label: t('setupChecklist.items.cover'),
      done: !!event.cover,
      href: `${base}/details`,
    },
    {
      id: 'description',
      label: t('setupChecklist.items.description'),
      done: event.has_description,
      href: `${base}/details`,
    },
    {
      id: 'location',
      label: t('setupChecklist.items.location'),
      done: event.has_location,
      href: `${base}/details`,
    },
    {
      id: 'date',
      label: t('setupChecklist.items.date'),
      done: !!event.computed_start_date,
      href: `${base}/details`,
    },
  ];

  if (registration && (event.type === 'registration' || registration.required)) {
    items.push({
      id: 'registration-questions',
      label: t('setupChecklist.items.registrationQuestions'),
      done: registration.questionCount > 0,
      href: `${base}/registration`,
    });
  }

  if (tickets) {
    items.push({
      id: 'ticket-types',
      label: t('setupChecklist.items.ticketTypes'),
      done: tickets.activeTypesCount > 0,
      href: `${base}/tickets`,
    });
  }

  items.push(
    {
      id: 'reminders',
      label: t('setupChecklist.items.reminders'),
      done: communications.reminders.offsets.length > 0,
      href: `${base}/reminders`,
    },
    {
      id: 'invites',
      label: t('setupChecklist.items.invites'),
      done: invites.total > 0 || rsvps.total > 1,
      onClick: onInviteGuests,
    },
    {
      id: 'published',
      label: t('setupChecklist.items.published'),
      done: event.status !== 'draft',
      hint: t('setupChecklist.items.publishedHint'),
    }
  );

  return items;
}

export function SetupChecklist({ dashboard, onInviteGuests }: SetupChecklistProps) {
  const t = useTranslations('manage');
  const items = buildChecklist(dashboard, onInviteGuests, t);
  const doneCount = items.filter((item) => item.done).length;
  const allDone = doneCount === items.length;

  if (allDone && dashboard.event.status === 'published') {
    return (
      <section className='flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400'>
          <PartyPopper className='h-4 w-4' />
        </div>
        <div>
          <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
            {t('setupChecklist.allSetTitle')}
          </p>
          <p className='text-xs text-gray-500 dark:text-neutral-400'>
            {t('setupChecklist.allSetDescription')}
          </p>
        </div>
      </section>
    );
  }

  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
          {t('setupChecklist.title')}
        </h2>
        <span className='text-sm tabular-nums text-gray-500 dark:text-neutral-400'>
          {doneCount}/{items.length}
        </span>
      </div>
      <div className='mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800'>
        <div
          className='h-full rounded-full bg-green-500 transition-all dark:bg-green-400'
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className='space-y-1'>
        {items.map((item) => {
          const content = (
            <>
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  item.done
                    ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400 dark:text-neutral-950'
                    : 'border-gray-300 dark:border-neutral-700'
                )}
              >
                {item.done && <Check className='h-3 w-3' strokeWidth={3} />}
              </span>
              <span className='min-w-0 flex-1'>
                <span
                  className={cn(
                    'block truncate text-sm',
                    item.done
                      ? 'text-gray-400 line-through dark:text-neutral-500'
                      : 'text-gray-900 dark:text-neutral-100'
                  )}
                >
                  {item.label}
                </span>
                {!item.done && item.hint && (
                  <span className='block truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {item.hint}
                  </span>
                )}
              </span>
              {!item.done && (item.href || item.onClick) && (
                <ChevronRight className='h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500' />
              )}
            </>
          );
          const rowClassName =
            'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800';

          return (
            <li key={item.id}>
              {item.done ? (
                <div className='flex w-full items-center gap-3 px-2 py-2'>{content}</div>
              ) : item.href ? (
                <Link href={item.href} className={rowClassName}>
                  {content}
                </Link>
              ) : item.onClick ? (
                <button type='button' onClick={item.onClick} className={rowClassName}>
                  {content}
                </button>
              ) : (
                <div className='flex w-full items-center gap-3 px-2 py-2'>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SetupChecklistSkeleton() {
  return (
    <div className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-8' />
      </div>
      <Skeleton className='h-1.5 w-full' />
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='flex items-center gap-3 px-2 py-1'>
          <Skeleton className='h-5 w-5 rounded-full' />
          <Skeleton className='h-4 flex-1' />
        </div>
      ))}
    </div>
  );
}
