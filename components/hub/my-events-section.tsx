'use client';

import EventSearchSheet from '@/components/event-search-sheet';
import { Button } from '@/components/ui/button';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { EventFilterType, useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { formatDateHeader } from '@/lib/utils/date';
import { ArrowRight, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

export function MyEventsSection() {
  const { user } = useUserProfile();
  const [activeTab, setActiveTab] = useState<EventFilterType>('upcoming');
  const [loadedTabs, setLoadedTabs] = useState<EventFilterType[]>(['upcoming']);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Only load data for tabs that have been opened (6 events max, future only)
  const upcomingQuery = useUserEvents({
    filter: 'upcoming',
    timeframe: 'future',
    limit: 6,
    enabled: loadedTabs.includes('upcoming'),
  });

  const hostingQuery = useUserEvents({
    filter: 'hosting',
    timeframe: 'future',
    limit: 6,
    enabled: loadedTabs.includes('hosting'),
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
      default:
        return upcomingQuery;
    }
  };

  const currentQuery = getCurrentQuery();
  const events = currentQuery.data?.pages?.[0]?.events || [];
  const isLoading = currentQuery.isLoading;

  // Group events by date
  const groupedEvents = events.reduce(
    (groups: { date: string; events: typeof events }[], event) => {
      const date = event.computed_start_date;
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
          ]}
          wrapperClassName='mt-2'
        />

        {/* Content - Vertical list */}
        <div className='mt-2'>
          {isLoading ? (
            // Skeleton loading for vertical layout
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`ske-${index}`}
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
          ) : events.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Calendar className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>
                {activeTab === 'upcoming' && 'No upcoming events'}
                {activeTab === 'hosting' && "No events you're hosting"}
              </h3>
              <p className='mb-4 text-sm text-gray-500'>
                {activeTab === 'upcoming' && 'Create your first event or RSVP to others'}
                {activeTab === 'hosting' && 'Create an event to get started'}
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
                View All Events <ArrowRight className='h-4 w-4' />
              </Button>
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
    </>
  );
}
