'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import EventSearchSheet from '@/components/event-search-sheet';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { EventFilterType, useUserEvents } from '@/lib/hooks/use-user-events';
import { EventWithUser, HubSectionError } from '@/lib/types/api';
import { UNDATED_DATE_KEY, formatDateHeader } from '@/lib/utils/date';
import { getProfileEventDateKey } from '@/lib/utils/profile-events';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  MapPinHouse,
  Search,
  UserRoundPen,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

type MyEventsTab = EventFilterType | 'drafts';

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
    limit: 6,
    enabled: loadedTabs.includes('hosting'),
  });

  const draftsQuery = useMyDraftEvents({
    limit: 6,
    enabled: loadedTabs.includes('drafts'),
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
      default:
        return null;
    }
  };

  const currentQuery = getCurrentQuery();
  const events =
    activeTab === 'upcoming' ? upcomingEvents : currentQuery?.data?.pages?.[0]?.events || [];
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

  const handleViewAll = () => {
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className='flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>My Events</h2>
        </div>

        {/* Animated Tabs */}
        <div className='mt-2 flex items-center justify-between'>
          <AnimatedTabs
            expanded={!isMobile}
            tabs={[
              { title: 'Upcoming', icon: Calendar, onClick: () => setActiveTab('upcoming') },
              { title: 'Hosting', icon: MapPinHouse, onClick: () => setActiveTab('hosting') },
              { title: 'Drafts', icon: UserRoundPen, onClick: () => setActiveTab('drafts') },
            ]}
            selected={['upcoming', 'hosting', 'drafts'].indexOf(activeTab)}
          />
          <CircledIconButton icon={Search} onClick={handleViewAll} />
        </div>

        {/* Content - Vertical list */}
        <div className='mt-2'>
          {isLoading ? (
            // Skeleton loading for vertical layout
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 6 }, (_, idx) => `ske-${idx}`).map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className='flex items-start gap-4 rounded-3xl bg-gray-50 p-4'
                >
                  {/* Left content skeleton */}
                  <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <div className='h-4 w-32 rounded bg-gray-200' />
                    <div className='h-5 w-3/4 rounded bg-gray-200' />
                    <div className='flex items-center gap-2'>
                      <div className='h-5 w-5 rounded-full bg-gray-200' />
                      <div className='h-3 w-24 rounded bg-gray-200' />
                    </div>
                    <div className='flex items-center gap-1'>
                      <div className='h-3.5 w-3.5 rounded bg-gray-200' />
                      <div className='h-3 w-32 rounded bg-gray-200' />
                    </div>
                  </div>
                  {/* Right image skeleton */}
                  <div className='h-24 w-24 shrink-0 rounded-xl bg-gray-200' />
                </div>
              ))}
            </div>
          ) : hasError ? (
            <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900'>
              <div className='mb-2 flex items-center gap-2 text-sm font-semibold'>
                <AlertTriangle className='h-4 w-4' />
                Could not load upcoming events
              </div>
              <p className='text-sm text-amber-800'>{upcomingError?.message}</p>
            </div>
          ) : events.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Calendar className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>
                {activeTab === 'upcoming' && 'No upcoming events'}
                {activeTab === 'hosting' && "No events you're hosting"}
                {activeTab === 'drafts' && 'No draft events'}
              </h3>
              <p className='mb-4 text-sm text-gray-500'>
                {activeTab === 'upcoming' && 'Create your first event or RSVP to others'}
                {activeTab === 'hosting' && 'Create an event to get started'}
                {activeTab === 'drafts' && 'Your draft events will appear here'}
              </p>
            </div>
          ) : (
            // Vertical list of events grouped by date
            <>
              <div className='flex flex-col gap-4'>
                {groupedEvents.map((group) => (
                  <div key={group.date} className='space-y-2'>
                    <h3 className='text-sm font-medium text-gray-500'>
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
                className='mt-3 w-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
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
            initialFilter={activeTab === 'drafts' ? 'hosting' : activeTab}
          />
        </div>
      </div>
    </>
  );
}
