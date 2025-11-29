'use client';

import EventSearchSheet from '@/components/event-search-sheet';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { EventFilterType, useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { EventWithUser } from '@/lib/types/api';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

export function MyEventsSection() {
  const { user } = useUserProfile();
  const [activeTab, setActiveTab] = useState<EventFilterType>('upcoming');
  const [loadedTabs, setLoadedTabs] = useState<EventFilterType[]>(['upcoming']);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Only load data for tabs that have been opened (12 events = 4 columns × 3 cards)
  const upcomingQuery = useUserEvents({
    username: user?.username,
    filter: 'upcoming',
    limit: 12,
    enabled: loadedTabs.includes('upcoming'),
  });

  const hostingQuery = useUserEvents({
    username: user?.username,
    filter: 'hosting',
    limit: 12,
    enabled: loadedTabs.includes('hosting'),
  });

  const attendingQuery = useUserEvents({
    username: user?.username,
    filter: 'attending',
    limit: 12,
    enabled: loadedTabs.includes('attending'),
  });

  // Track when tabs are opened for lazy loading
  useEffect(() => {
    if (!loadedTabs.includes(activeTab)) {
      setLoadedTabs((prev) => [...prev, activeTab]);
    }
  }, [activeTab]);

  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingQuery;
      case 'hosting':
        return hostingQuery;
      case 'attending':
        return attendingQuery;
      default:
        return upcomingQuery;
    }
  };

  const currentQuery = getCurrentQuery();
  const events = currentQuery.data?.pages?.[0]?.events || [];
  const isLoading = currentQuery.isLoading;

  const ctaLabel = useMemo(() => {
    if (activeTab === 'upcoming') return 'View All Upcoming Events';
    if (activeTab === 'hosting') return 'View All Hosting Events';
    return 'View All Attending Events';
  }, [activeTab]);

  const getTabCount = (tab: EventFilterType) => {
    switch (tab) {
      case 'upcoming':
        return upcomingQuery.data?.pages?.[0]?.pagination.totalCount || 0;
      case 'hosting':
        return hostingQuery.data?.pages?.[0]?.pagination.totalCount || 0;
      case 'attending':
        return attendingQuery.data?.pages?.[0]?.pagination.totalCount || 0;
      default:
        return 0;
    }
  };

  const totalCount = useMemo(
    () => getTabCount(activeTab),
    [activeTab, upcomingQuery.data, hostingQuery.data, attendingQuery.data]
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

        {/* Segmented Tabs */}
        <SegmentedTabs
          align='left'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as EventFilterType)}
          items={[
            {
              value: 'upcoming',
              label: 'Upcoming',
            },
            {
              value: 'hosting',
              label: 'Hosting',
            },
            {
              value: 'attending',
              label: 'Attending',
            },
          ]}
          wrapperClassName='mt-2'
        />

        {/* Content - Horizontal scrollable grid */}
        <div className='mt-2'>
          {isLoading ? (
            // Skeleton loading for horizontal column layout
            <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2'>
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <div
                  key={`col-ske-${colIndex}`}
                  className='flex w-[90%] shrink-0 flex-col gap-2 md:w-[70%]'
                >
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <div
                      key={`ske-${colIndex}-${cardIndex}`}
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
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Calendar className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>
                {activeTab === 'upcoming' && 'No upcoming events'}
                {activeTab === 'hosting' && "No events you're hosting"}
                {activeTab === 'attending' && "No events you're attending"}
              </h3>
              <p className='mb-4 text-sm text-gray-500'>
                {activeTab === 'upcoming' && 'Create your first event or RSVP to others'}
                {activeTab === 'hosting' && 'Create an event to get started'}
                {activeTab === 'attending' && 'RSVP to events to see them here'}
              </p>
            </div>
          ) : (
            // Group events into columns of 3 for horizontal scroll
            // View All card is treated as the last card in the sequence
            (() => {
              const hasMoreEvents = totalCount > events.length;
              // If we have more events, reserve last slot for View All card
              const maxEventsToShow = hasMoreEvents ? 11 : 12;
              const eventsToShow = events.slice(0, maxEventsToShow);

              // Build items array: events + optional View All card
              type ColumnItem = { type: 'event'; event: EventWithUser } | { type: 'viewAll' };
              const items: ColumnItem[] = eventsToShow.map((event) => ({
                type: 'event',
                event,
              }));
              if (hasMoreEvents) {
                items.push({ type: 'viewAll' });
              }

              // Group items into columns of 3
              const columns: ColumnItem[][] = [];
              for (let i = 0; i < items.length; i += 3) {
                columns.push(items.slice(i, i + 3));
              }

              return (
                <div className='scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2'>
                  {columns.map((columnItems, colIndex) => (
                    <div
                      key={colIndex}
                      className='flex w-[90%] shrink-0 snap-start flex-col gap-2 first:pl-4 md:w-[70%] md:first:pl-0'
                    >
                      {columnItems.map((item, itemIndex) =>
                        item.type === 'event' ? (
                          <MasterEventCard key={item.event.id} event={item.event} />
                        ) : (
                          <button
                            key='view-all'
                            onClick={handleViewAll}
                            aria-label={ctaLabel}
                            className='relative flex w-full items-start gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100'
                          >
                            {/* Soft background gradient */}
                            <div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-red-50/70 via-transparent to-amber-50/70 opacity-80' />

                            {/* Left content */}
                            <div className='relative flex min-w-0 flex-1 flex-col gap-1'>
                              <div className='inline-flex items-center gap-1 text-sm'>
                                <Sparkles className='h-3.5 w-3.5 text-amber-500' />
                                <span className='font-medium text-amber-600'>Discover more</span>
                              </div>
                              <h3 className='text-lg font-bold leading-tight text-gray-900'>
                                {ctaLabel}
                              </h3>
                              <p className='text-sm text-gray-600'>
                                Explore the full list of your {activeTab.toLowerCase()} events.
                              </p>
                              <div className='mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white'>
                                View all <ArrowRight className='h-4 w-4' />
                              </div>
                            </div>

                            {/* Right placeholder - same size as event image */}
                            <div className='relative flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-100'>
                              <span className='text-2xl font-bold text-gray-600'>
                                +{Math.max(totalCount - eventsToShow.length, 0)}
                              </span>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
          )}
          <EventSearchSheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            username={user?.username}
            initialFilter={activeTab}
          />
        </div>
      </div>
    </>
  );
}
