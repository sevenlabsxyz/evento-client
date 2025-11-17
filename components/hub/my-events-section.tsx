'use client';

import EventSearchSheet from '@/components/event-search-sheet';
import { Button } from '@/components/ui/button';
import DetachedMenuSheet from '@/components/ui/detached-menu-sheet';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { EventFilterType, useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import {
  ArrowRight,
  Calendar,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EventCard } from '../event-card';
import { EventCompactItem } from '../event-compact-item';

export function MyEventsSection() {
  const { user } = useUserProfile();
  const [activeTab, setActiveTab] = useState<EventFilterType>('upcoming');
  const [loadedTabs, setLoadedTabs] = useState<EventFilterType[]>(['upcoming']);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Only load data for tabs that have been opened
  const upcomingQuery = useUserEvents({
    username: user?.username,
    filter: 'upcoming',
    limit: 10,
    enabled: loadedTabs.includes('upcoming'),
  });

  const hostingQuery = useUserEvents({
    username: user?.username,
    filter: 'hosting',
    limit: 10,
    enabled: loadedTabs.includes('hosting'),
  });

  const attendingQuery = useUserEvents({
    username: user?.username,
    filter: 'attending',
    limit: 10,
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

  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'card' ? 'list' : 'card'));
    setIsMenuOpen(false);
  };

  const handleViewAll = () => {
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className='flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Events</h2>
          <div className='flex items-center gap-2'>
            <Button
              onClick={() => setIsMenuOpen(true)}
              size='sm'
              variant='ghost'
              className='h-8 w-8 rounded-full bg-white p-0 shadow-sm'
              aria-label='More options'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </div>
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

        {/* Content */}
        <div className='mt-2'>
          {isLoading ? (
            // Skeleton loading adapts to view mode
            viewMode === 'card' ? (
              <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 py-1'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`ske-card-${i}`}
                    className='w-[25rem] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'
                  >
                    {/* Header skeleton */}
                    <div className='flex items-center justify-between px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='h-8 w-8 rounded-full bg-gray-100' />
                        <div className='space-y-1'>
                          <div className='h-3 w-28 rounded bg-gray-100' />
                          <div className='h-2.5 w-36 rounded bg-gray-100' />
                        </div>
                      </div>
                      <div className='h-8 w-8 rounded-full bg-gray-100' />
                    </div>
                    {/* Image skeleton */}
                    <div className='mx-auto aspect-square w-[calc(94%)] rounded-2xl bg-gray-100' />
                    {/* Body skeleton */}
                    <div className='px-4 py-3'>
                      <div className='mb-2 h-5 w-3/4 rounded bg-gray-100' />
                      <div className='mb-3 flex items-center gap-4 text-base text-gray-500'>
                        <div className='h-3 w-24 rounded bg-gray-100' />
                        <div className='h-3 w-20 rounded bg-gray-100' />
                      </div>
                      <div className='mb-3 h-3 w-40 rounded bg-gray-100' />
                      <div className='flex items-center gap-4'>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={`act-${j}`} className='h-8 w-8 rounded-full bg-gray-100' />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col gap-1'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={`ske-list-${i}`} className='flex items-center gap-3 rounded-lg p-2'>
                    {/* Thumbnail */}
                    <div className='h-14 w-14 rounded-md bg-gray-100' />
                    {/* Text block */}
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 h-4 w-2/3 rounded bg-gray-100' />
                      <div className='flex items-center gap-3 text-xs'>
                        <div className='h-3 w-20 rounded bg-gray-100' />
                        <div className='h-3 w-16 rounded bg-gray-100' />
                        <div className='h-3 w-24 rounded bg-gray-100' />
                      </div>
                      <div className='mt-2 flex items-center gap-2'>
                        <div className='h-4 w-4 rounded-full bg-gray-100' />
                        <div className='h-3 w-24 rounded bg-gray-100' />
                      </div>
                    </div>
                    {/* Trailing icon */}
                    <div className='h-4 w-4 rounded-full bg-gray-100' />
                  </div>
                ))}
              </div>
            )
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
            <>
              {viewMode === 'card' ? (
                <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 py-1'>
                  {events.slice(0, 10).map((event) => (
                    <div key={event.id} className='w-[25rem] shrink-0 overflow-hidden rounded-2xl'>
                      <EventCard event={event} className='h-full w-full' />
                    </div>
                  ))}

                  {totalCount > events.length && (
                    <button
                      onClick={handleViewAll}
                      aria-label={ctaLabel}
                      className='group relative w-[25rem] shrink-0 overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white text-left shadow-sm transition hover:border-gray-300 hover:shadow-md'
                    >
                      {/* Soft background gradient */}
                      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50/70 via-transparent to-amber-50/70 opacity-80' />

                      {/* Content */}
                      <div className='relative flex h-full flex-col gap-3 p-4'>
                        {/* Discover pill */}
                        <div className='inline-flex items-center gap-2'>
                          <div className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600'>
                            <Sparkles className='h-3.5 w-3.5 text-amber-500' />
                            Discover more
                          </div>
                        </div>

                        <div className='mx-auto aspect-square w-full rounded-2xl border border-gray-200 bg-gray-100/80'>
                          <div className='flex h-full w-full items-center justify-center'>
                            <span className='text-5xl font-bold text-gray-700'>
                              +{Math.max(totalCount - Math.min(events.length, 10), 0)}
                            </span>
                          </div>
                        </div>

                        <div className='mt-1'>
                          <div className='line-clamp-2 text-lg font-semibold leading-snug text-gray-900'>
                            {ctaLabel}
                          </div>
                          <div className='mt-1 text-sm text-gray-600'>
                            Explore the full list of your {activeTab.toLowerCase()} events.
                          </div>
                        </div>

                        <div className='mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-black px-3 py-1.5 text-sm font-medium text-white transition group-hover:bg-red-600'>
                          View all <ArrowRight className='h-4 w-4' />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                <div className='flex flex-col gap-1'>
                  {events.slice(0, 10).map((event) => (
                    <EventCompactItem key={event.id} event={event} />
                  ))}

                  {totalCount > events.length && (
                    <button
                      onClick={handleViewAll}
                      aria-label={ctaLabel}
                      className='relative flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:border-gray-300'
                    >
                      {/* Soft background gradient */}
                      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50/70 via-transparent to-amber-50/70 opacity-80' />

                      {/* Thumbnail placeholder with +count */}
                      <div className='flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50'>
                        <span className='text-base font-semibold text-gray-600'>
                          +{Math.max(totalCount - Math.min(events.length, 10), 0)}
                        </span>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between'>
                          <h4 className='line-clamp-1 font-medium text-gray-900'>{ctaLabel}</h4>
                        </div>
                        <div className='mt-1 text-xs text-gray-500'>
                          Explore the full list of your {activeTab.toLowerCase()} events.
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <EventSearchSheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            username={user?.username}
            initialFilter={activeTab}
          />
        </div>
      </div>

      {isMenuOpen && (
        <DetachedMenuSheet
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          options={[
            {
              id: 'toggle-view',
              label: viewMode === 'card' ? 'Switch to list view' : 'Switch to card view',
              icon: viewMode === 'card' ? LayoutGrid : LayoutList,
              onClick: handleToggleView,
            },
          ]}
        />
      )}
    </>
  );
}
