'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import EventSearchSheet from '@/components/event-search-sheet';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { EventWithUser, HubSectionError } from '@/lib/types/api';
import { UNDATED_DATE_KEY, formatDateHeader } from '@/lib/utils/date';
import { getProfileEventDateKey } from '@/lib/utils/profile-events';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  History,
  LucideIcon,
  MapPinHouse,
  Search,
  UserRoundPen,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

type MyEventsTab = 'upcoming' | 'hosting' | 'drafts' | 'past';

/** Max events shown per tab on the hub; "View All" opens the full list. */
const HUB_EVENTS_LIMIT = 3;

const TAB_ORDER: MyEventsTab[] = ['upcoming', 'hosting', 'drafts', 'past'];

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

const EMPTY_STATES: Record<MyEventsTab, EmptyStateConfig> = {
  upcoming: {
    icon: Calendar,
    title: 'No upcoming events',
    description: 'RSVP to events or create your own',
    cta: { label: 'Find events', href: '/e/search' },
  },
  hosting: {
    icon: MapPinHouse,
    title: "No events you're hosting",
    description: 'Create an event to get started',
    cta: { label: 'Create event', href: '/e/create' },
  },
  drafts: {
    icon: UserRoundPen,
    title: 'No draft events',
    description: 'Your draft events will appear here',
    cta: { label: 'Create event', href: '/e/create' },
  },
  past: {
    icon: History,
    title: 'No past events',
    description: 'Events you hosted or attended will appear here',
  },
};

interface MyEventsSectionProps {
  username?: string;
  upcomingEvents?: EventWithUser[];
  upcomingTotalCount?: number | null;
  upcomingHasMore?: boolean;
  upcomingError?: HubSectionError;
}

export function MyEventsSection({
  username,
  upcomingEvents = [],
  upcomingTotalCount,
  upcomingHasMore = false,
  upcomingError,
}: MyEventsSectionProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<MyEventsTab>('upcoming');
  const [loadedTabs, setLoadedTabs] = useState<MyEventsTab[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const hostingQuery = useUserEvents({
    filter: 'hosting',
    timeframe: 'future',
    sortBy: 'date-asc',
    limit: HUB_EVENTS_LIMIT,
    enabled: loadedTabs.includes('hosting'),
  });

  const draftsQuery = useMyDraftEvents({
    limit: HUB_EVENTS_LIMIT,
    enabled: loadedTabs.includes('drafts'),
  });

  const pastQuery = useUserEvents({
    filter: 'upcoming',
    timeframe: 'past',
    sortBy: 'date-desc',
    limit: HUB_EVENTS_LIMIT,
    enabled: loadedTabs.includes('past'),
  });

  // Track when tabs are opened for lazy loading
  useEffect(() => {
    if (activeTab !== 'upcoming' && !loadedTabs.includes(activeTab)) {
      setLoadedTabs((prev) => [...prev, activeTab]);
    }
  }, [activeTab, loadedTabs]);

  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'hosting':
        return hostingQuery;
      case 'drafts':
        return draftsQuery;
      case 'past':
        return pastQuery;
      default:
        return null;
    }
  };

  const currentQuery = getCurrentQuery();
  const events = (
    activeTab === 'upcoming' ? upcomingEvents : currentQuery?.data?.pages?.[0]?.events || []
  ).slice(0, HUB_EVENTS_LIMIT);
  const isLoading = activeTab === 'upcoming' ? false : currentQuery?.isLoading || false;
  const hasError = activeTab === 'upcoming' ? !!upcomingError : false;

  // Group events by date
  const groupedEvents = events.reduce(
    (groups: { date: string; events: typeof events }[], event) => {
      const date = getProfileEventDateKey(event) ?? UNDATED_DATE_KEY;
      const group = groups.find((g) => g.date === date);

      if (group) {
        group.events.push(event);
      } else {
        groups.push({ date, events: [event] });
      }

      return groups;
    },
    []
  );

  // Past events are fetched newest-first; display them oldest-first so the
  // date groups read chronologically top-to-bottom, same as upcoming events.
  if (activeTab === 'past') {
    groupedEvents.reverse();
  }

  const handleViewAll = () => {
    setIsSheetOpen(true);
  };

  const emptyState = EMPTY_STATES[activeTab];
  const EmptyIcon = emptyState.icon;

  return (
    <section className='flex flex-col gap-3'>
      {/* Header */}
      <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>My Events</h2>

      {/* Tabs + search */}
      <div className='flex items-center justify-between gap-3'>
        <AnimatedTabs
          expanded={!isMobile}
          tabs={[
            { title: 'Upcoming', icon: Calendar, onClick: () => setActiveTab('upcoming') },
            { title: 'Hosting', icon: MapPinHouse, onClick: () => setActiveTab('hosting') },
            { title: 'Drafts', icon: UserRoundPen, onClick: () => setActiveTab('drafts') },
            { title: 'Past', icon: History, onClick: () => setActiveTab('past') },
          ]}
          selected={TAB_ORDER.indexOf(activeTab)}
        />
        <CircledIconButton icon={Search} onClick={handleViewAll} ariaLabel='Search my events' />
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: HUB_EVENTS_LIMIT }, (_, idx) => `ske-${idx}`).map(
              (skeletonKey) => (
                <div
                  key={skeletonKey}
                  className='flex animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-950'
                >
                  <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <div className='h-3 w-24 rounded bg-gray-200 dark:bg-neutral-800' />
                    <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-neutral-800' />
                    <div className='flex items-center gap-2'>
                      <div className='h-4 w-4 rounded-full bg-gray-200 dark:bg-neutral-800' />
                      <div className='h-3 w-24 rounded bg-gray-200 dark:bg-neutral-800' />
                    </div>
                  </div>
                  <div className='h-16 w-16 shrink-0 rounded-xl bg-gray-200 dark:bg-neutral-800' />
                </div>
              )
            )}
          </div>
        ) : hasError ? (
          <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-sm font-semibold'>Could not load upcoming events</p>
              <p className='text-sm text-amber-800 dark:text-amber-400'>{upcomingError?.message}</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className='flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:px-4'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 ring-1 ring-gray-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800'>
              <EmptyIcon className='h-4 w-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
                {emptyState.title}
              </p>
              <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                {emptyState.description}
              </p>
            </div>
            {emptyState.cta && (
              <Button
                asChild
                size='sm'
                variant='outline'
                className='h-8 shrink-0 bg-white text-xs font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'
              >
                <Link href={emptyState.cta.href}>{emptyState.cta.label}</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-3'>
              {groupedEvents.map((group) => (
                <div key={group.date} className='space-y-1.5'>
                  <h3 className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
                    {formatDateHeader(group.date)}
                  </h3>
                  <div className='flex flex-col gap-2'>
                    {group.events.map((event) => (
                      <MasterEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleViewAll}
              variant='ghost'
              className='mt-3 h-9 w-full rounded-full border border-gray-200 bg-gray-50 text-sm hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
            >
              View All Events
              {activeTab === 'upcoming' && (upcomingHasMore || upcomingTotalCount)
                ? ` (${upcomingTotalCount ?? upcomingEvents.length})`
                : ''}
              <ArrowRight className='h-4 w-4' />
            </Button>
          </>
        )}
        <EventSearchSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          username={username}
          isOwnProfile
          initialFilter={activeTab === 'drafts' || activeTab === 'past' ? 'upcoming' : activeTab}
          initialTimeframe={activeTab === 'past' ? 'past' : undefined}
          initialSortBy={activeTab === 'past' ? 'date-desc' : undefined}
        />
      </div>
    </section>
  );
}
