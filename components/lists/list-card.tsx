'use client';

import { ListEvent, UserList } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ListActionsMenu } from './list-actions-menu';
import { ListCoverMosaic } from './list-cover-mosaic';
import { formatRelativeTime, getListLastActivity } from './list-utils';

interface ListCardProps {
  list: UserList;
  events: ListEvent[] | undefined;
  isLoadingEvents: boolean;
  isDefault: boolean;
  onRename: () => void;
  /** Omitted for the default list. */
  onDelete?: () => void;
}

export function ListCard({
  list,
  events,
  isLoadingEvents,
  isDefault,
  onRename,
  onDelete,
}: ListCardProps) {
  const t = useTranslations('lists');
  const updatedLabel = formatRelativeTime(getListLastActivity(list, events));

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200',
        'hover:border-gray-300 hover:shadow-md motion-safe:hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2',
        'dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:ring-offset-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60 dark:hover:shadow-none'
      )}
    >
      <ListCoverMosaic events={events} isLoading={isLoadingEvents} />

      <div className='flex flex-1 flex-col gap-1 p-4'>
        <div className='flex min-w-0 items-center gap-2'>
          <h3 className='min-w-0 truncate text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {/* Stretched link: the whole card navigates, the actions button stays separate. */}
            <Link
              href={`/e/lists/${list.id}`}
              className='after:absolute after:inset-0 after:content-[""] focus:outline-none'
            >
              {list.name}
            </Link>
          </h3>
          {isDefault && (
            <span className='shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400'>
              {t('card.default')}
            </span>
          )}
        </div>

        {list.description && (
          <p className='line-clamp-1 text-sm text-gray-600 dark:text-neutral-400'>
            {list.description}
          </p>
        )}

        <p className='mt-auto flex min-w-0 items-center gap-1.5 pt-1 text-sm text-gray-500 dark:text-neutral-500'>
          {events ? (
            <span className='shrink-0 whitespace-nowrap font-medium text-gray-700 dark:text-neutral-300'>
              {t('eventCount', { count: events.length })}
            </span>
          ) : isLoadingEvents ? (
            <span
              aria-hidden='true'
              className='h-3.5 w-16 animate-pulse rounded bg-gray-200 dark:bg-neutral-700'
            />
          ) : null}
          {updatedLabel && (
            <>
              {(events || isLoadingEvents) && (
                <span aria-hidden='true' className='text-gray-300 dark:text-neutral-600'>
                  ·
                </span>
              )}
              <span className='min-w-0 truncate'>{t('updated', { time: updatedLabel })}</span>
            </>
          )}
        </p>
      </div>

      <div className='absolute right-3 top-3 z-10'>
        <ListActionsMenu listName={list.name} onRename={onRename} onDelete={onDelete} />
      </div>
    </article>
  );
}

export function ListCardSkeleton() {
  return (
    <div
      aria-hidden='true'
      className='flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
    >
      <div className='aspect-[4/3] w-full animate-pulse bg-gray-100 dark:bg-neutral-800' />
      <div className='flex flex-col gap-2 p-4'>
        <div className='h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
        <div className='h-3.5 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
      </div>
    </div>
  );
}
