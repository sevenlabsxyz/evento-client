'use client';

import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFollowingEvents } from '@/lib/hooks/use-following-events';
import { useForYouEvents } from '@/lib/hooks/use-for-you-events';
import { EventWithUser } from '@/lib/types/api';
import { formatDateHeader } from '@/lib/utils/date';
import { getErrorMessage } from '@/lib/utils/error-message';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  type LucideIcon,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { MasterEventCard } from '../master-event-card';
import { DiscoverEventCard, DiscoverEventCardSkeleton } from './discover-event-card';

const DISCOVER_DISPLAY_LIMIT = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type DiscoverFilter = 'featured' | 'week' | 'following';

interface DiscoverFilterConfig {
  id: DiscoverFilter;
  icon: LucideIcon;
}

const DISCOVER_FILTERS: DiscoverFilterConfig[] = [
  { id: 'featured', icon: Sparkles },
  { id: 'week', icon: CalendarDays },
  { id: 'following', icon: Users },
];

interface DiscoverSectionProps {
  discoverEvents: EventWithUser[];
  discoverHasMore: boolean;
  discoverTotalCount: number | null;
  discoverError?: string;
}

function toTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

function hasNotEnded(event: EventWithUser, now: number): boolean {
  const end = toTime(event.computed_end_date) ?? toTime(event.computed_start_date);
  return end === null || end >= now;
}

/** Events that start within the next 7 days, plus ones already in progress. */
function isThisWeek(event: EventWithUser, now: number): boolean {
  const start = toTime(event.computed_start_date);
  if (start === null || start > now + WEEK_MS) return false;
  return start >= now || hasNotEnded(event, now);
}

function mergeUniqueEvents(primary: EventWithUser[], secondary: EventWithUser[]): EventWithUser[] {
  const seen = new Set<string>();
  const merged: EventWithUser[] = [];
  for (const event of [...primary, ...secondary]) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
  }
  return merged;
}

function groupEventsByDay(events: EventWithUser[]) {
  return events.reduce((groups: { label: string; events: EventWithUser[] }[], event) => {
    const label = formatDateHeader(event.computed_start_date);
    const group = groups.find((g) => g.label === label);
    if (group) {
      group.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
    return groups;
  }, []);
}

function DiscoverGridSkeleton({ count }: { count: number }) {
  return (
    <div
      className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
      data-testid='discover-skeleton'
    >
      {Array.from({ length: count }, (_, index) => (
        <DiscoverEventCardSkeleton key={`discover-skeleton-${index}`} />
      ))}
    </div>
  );
}

function DiscoverErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTranslations('hub');
  return (
    <div
      role='alert'
      className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
    >
      <div className='mb-1 flex items-center gap-2 text-sm font-semibold'>
        <AlertTriangle className='h-4 w-4' aria-hidden='true' />
        {t('discover.loadError')}
      </div>
      <p className='text-sm text-amber-800 dark:text-amber-400'>{message}</p>
      {onRetry && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onRetry}
          className='mt-3 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-950'
        >
          {t('discover.tryAgain')}
        </Button>
      )}
    </div>
  );
}

function DiscoverEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className='flex flex-col items-start gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center'>
      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-none'>
        <Icon className='h-5 w-5' aria-hidden='true' />
      </div>
      <div className='min-w-0 flex-1'>
        <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>{title}</h3>
        <p className='mt-0.5 text-sm text-gray-500 dark:text-neutral-400'>{description}</p>
      </div>
      {children && <div className='flex shrink-0 flex-wrap gap-2'>{children}</div>}
    </div>
  );
}

function SearchEventsLink({ label }: { label: string }) {
  return (
    <Button asChild variant='outline' size='sm' className='dark:border-neutral-700'>
      <Link href='/e/search'>
        <Search className='h-4 w-4' aria-hidden='true' />
        {label}
      </Link>
    </Button>
  );
}

export function DiscoverSection({
  discoverEvents,
  discoverHasMore,
  discoverTotalCount,
  discoverError,
}: DiscoverSectionProps) {
  const t = useTranslations('hub');
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('featured');
  const [showFeedSheet, setShowFeedSheet] = useState(false);

  // Lazy: following feed loads only while its chip is active; the full featured feed only
  // loads when the "View all" sheet is opened for Featured / This week.
  const followingQuery = useFollowingEvents({ enabled: activeFilter === 'following' });
  const forYouQuery = useForYouEvents({
    enabled: showFeedSheet && activeFilter !== 'following',
  });

  const now = Date.now();
  const activeConfig =
    DISCOVER_FILTERS.find((filter) => filter.id === activeFilter) ?? DISCOVER_FILTERS[0];

  const weekEvents = discoverEvents.filter((event) => isThisWeek(event, now));
  const followingEvents = followingQuery.data ?? [];

  const gridSource =
    activeFilter === 'featured'
      ? discoverEvents
      : activeFilter === 'week'
        ? weekEvents
        : followingEvents;
  const gridEvents = gridSource.slice(0, DISCOVER_DISPLAY_LIMIT);

  const isLoading = activeFilter === 'following' && followingQuery.isLoading;
  const errorMessage =
    activeFilter === 'following'
      ? followingQuery.error && !followingQuery.data
        ? getErrorMessage(followingQuery.error)
        : null
      : discoverError || null;

  const canViewAll =
    !isLoading &&
    !errorMessage &&
    (activeFilter === 'featured'
      ? discoverHasMore || discoverEvents.length > DISCOVER_DISPLAY_LIMIT
      : gridSource.length > DISCOVER_DISPLAY_LIMIT);
  const viewAllCount =
    activeFilter === 'featured' ? (discoverTotalCount ?? null) : gridSource.length;

  // Full feed for the sheet: the complete featured list plus the hub's upcoming top-up,
  // excluding anything that has already ended.
  const fullDiscoverFeed = mergeUniqueEvents(forYouQuery.data ?? [], discoverEvents).filter(
    (event) => hasNotEnded(event, now)
  );
  const sheetEvents =
    activeFilter === 'featured'
      ? fullDiscoverFeed
      : activeFilter === 'week'
        ? fullDiscoverFeed.filter((event) => isThisWeek(event, now))
        : followingEvents;
  const sheetGroups = groupEventsByDay(sheetEvents);
  const isSheetLoading = activeFilter !== 'following' && forYouQuery.isLoading && !forYouQuery.data;
  const sheetError =
    activeFilter !== 'following' && forYouQuery.error && !forYouQuery.data
      ? getErrorMessage(forYouQuery.error)
      : null;

  const renderEmptyState = () => {
    switch (activeFilter) {
      case 'week':
        return (
          <DiscoverEmptyState
            icon={CalendarDays}
            title={t('discover.empty.week.title')}
            description={t('discover.empty.week.description')}
          >
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setActiveFilter('featured')}
              className='dark:hover:bg-neutral-800'
            >
              {t('discover.empty.week.seeFeatured')}
            </Button>
            <SearchEventsLink label={t('discover.empty.searchEvents')} />
          </DiscoverEmptyState>
        );
      case 'following':
        return (
          <DiscoverEmptyState
            icon={Users}
            title={t('discover.empty.following.title')}
            description={t('discover.empty.following.description')}
          >
            <SearchEventsLink label={t('discover.empty.following.findHosts')} />
          </DiscoverEmptyState>
        );
      default:
        return (
          <DiscoverEmptyState
            icon={Sparkles}
            title={t('discover.empty.featured.title')}
            description={t('discover.empty.featured.description')}
          >
            <SearchEventsLink label={t('discover.empty.searchEvents')} />
          </DiscoverEmptyState>
        );
    }
  };

  return (
    <section
      id='discover'
      aria-labelledby='discover-heading'
      className='flex scroll-mt-6 flex-col gap-4'
    >
      <div className='flex items-end justify-between gap-3'>
        <div className='min-w-0'>
          <h2
            id='discover-heading'
            className='text-xl font-semibold text-gray-900 dark:text-neutral-100'
          >
            {t('discover.title')}
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t(`discover.filters.${activeConfig.id}.description`)}
          </p>
        </div>
        {canViewAll && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => setShowFeedSheet(true)}
            className='shrink-0 text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          >
            {viewAllCount
              ? t('discover.viewAllCount', { count: viewAllCount })
              : t('discover.viewAll')}
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
          </Button>
        )}
      </div>

      <AnimatedTabs
        expanded={!isMobile}
        tabs={DISCOVER_FILTERS.map((filter) => ({
          title: t(`discover.filters.${filter.id}.title`),
          icon: filter.icon,
          onClick: () => setActiveFilter(filter.id),
        }))}
        selected={DISCOVER_FILTERS.findIndex((filter) => filter.id === activeFilter)}
      />

      {isLoading ? (
        <DiscoverGridSkeleton count={DISCOVER_DISPLAY_LIMIT} />
      ) : errorMessage ? (
        <DiscoverErrorState
          message={errorMessage}
          onRetry={activeFilter === 'following' ? () => void followingQuery.refetch() : undefined}
        />
      ) : gridEvents.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {gridEvents.map((event) => (
            <DiscoverEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <MasterScrollableSheet
        title={t(`discover.filters.${activeConfig.id}.sheetTitle`)}
        open={showFeedSheet}
        onOpenChange={setShowFeedSheet}
      >
        <div className='flex flex-col gap-4 px-4 pb-8'>
          {isSheetLoading ? (
            <div className='flex flex-col gap-2'>
              {['sheet-ske-a', 'sheet-ske-b', 'sheet-ske-c', 'sheet-ske-d'].map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className='flex items-start gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'
                >
                  <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <div className='h-4 w-32 rounded bg-gray-200 dark:bg-neutral-700' />
                    <div className='h-5 w-3/4 rounded bg-gray-200 dark:bg-neutral-700' />
                    <div className='flex items-center gap-2'>
                      <div className='h-5 w-5 rounded-full bg-gray-200 dark:bg-neutral-700' />
                      <div className='h-3 w-24 rounded bg-gray-200 dark:bg-neutral-700' />
                    </div>
                  </div>
                  <div className='h-24 w-24 shrink-0 rounded-xl bg-gray-200 dark:bg-neutral-700' />
                </div>
              ))}
            </div>
          ) : sheetError ? (
            <DiscoverErrorState message={sheetError} onRetry={() => void forYouQuery.refetch()} />
          ) : sheetGroups.length === 0 ? (
            <p className='py-12 text-center text-sm text-gray-500 dark:text-neutral-400'>
              {t('discover.sheetEmpty')}
            </p>
          ) : (
            sheetGroups.map((group) => (
              <div key={group.label} className='space-y-2'>
                <h3 className='text-sm font-medium text-gray-500 dark:text-neutral-400'>
                  {group.label}
                </h3>
                <div className='flex flex-col gap-2'>
                  {group.events.map((event) => (
                    <MasterEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </MasterScrollableSheet>
    </section>
  );
}
