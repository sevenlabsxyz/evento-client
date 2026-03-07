'use client';

import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFollowingEvents } from '@/lib/hooks/use-following-events';
import { useForYouEvents } from '@/lib/hooks/use-for-you-events';
import { EventWithUser } from '@/lib/types/api';
import { formatDateHeader } from '@/lib/utils/date';
import { ArrowRight, Calendar, Compass, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

type ForYouTabType = 'following' | 'discover';

export function ForYouSection() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<ForYouTabType>('discover');
  const [loadedTabs, setLoadedTabs] = useState<ForYouTabType[]>(['discover']);
  const [showFollowFeedSheet, setShowFollowFeedSheet] = useState(false);

  // Only load data for tabs that have been opened
  const followingQuery = useFollowingEvents({
    enabled: loadedTabs.includes('following'),
  });

  const discoverQuery = useForYouEvents({
    enabled: loadedTabs.includes('discover'),
  });

  // Track when tabs are opened for lazy loading
  useEffect(() => {
    if (!loadedTabs.includes(activeTab)) {
      setLoadedTabs((prev) => [...prev, activeTab]);
    }
  }, [activeTab, loadedTabs]);

  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'following':
        return followingQuery;
      case 'discover':
        return discoverQuery;
      default:
        return followingQuery;
    }
  };

  const currentQuery = getCurrentQuery();

  // Both queries now return simple arrays
  const followingEvents = followingQuery.data || [];
  const discoverEvents = discoverQuery.data || [];
  const events = activeTab === 'discover' ? discoverEvents : followingEvents;
  const isLoading = currentQuery.isLoading;
  const isError = currentQuery.isError;

  // Discover shows up to 3, Following shows up to 3
  const displayLimit = 3;

  // Group events by date
  const groupEventsByDate = (eventsToGroup: EventWithUser[]) => {
    return eventsToGroup.reduce((groups: { date: string; events: EventWithUser[] }[], event) => {
      const date = event.computed_start_date;
      const group = groups.find((g) => g.date === date);
      if (group) {
        group.events.push(event);
      } else {
        groups.push({ date, events: [event] });
      }
      return groups;
    }, []);
  };

  // Get limited events and group them
  const limitedEvents = events.slice(0, displayLimit);
  const groupedEvents = groupEventsByDate(limitedEvents);

  // Group all following events for the sheet
  const groupedFollowingEvents = groupEventsByDate(followingEvents);

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>For You</h2>
      </div>

      {/* Segmented Tabs */}
      <AnimatedTabs
        expanded={!isMobile}
        tabs={[
          { title: 'Discover', icon: Compass, onClick: () => setActiveTab('discover') },
          { title: 'Following', icon: Users, onClick: () => setActiveTab('following') },
        ]}
        selected={['discover', 'following'].indexOf(activeTab)}
        className='mt-2'
      />

      {/* Content */}
      <div className='mt-2'>
        {isLoading ? (
          // Skeleton loading for MasterEventCard layout
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`ske-${i}`}
                className='flex items-start gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4'
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
        ) : isError ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <p className='mb-2 text-sm text-gray-500'>Couldn&apos;t load events</p>
            <button
              onClick={() => currentQuery.refetch()}
              className='text-sm font-medium text-primary underline'
            >
              Tap to retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
              <Calendar className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-base font-semibold text-gray-900'>
              {activeTab === 'following' && 'No events from people you follow'}
              {activeTab === 'discover' && 'No featured events for you'}
            </h3>
            <p className='mb-4 text-sm text-gray-500'>
              {activeTab === 'following' && 'Follow creators to see their upcoming events here'}
              {activeTab === 'discover' && 'Check back soon for featured events'}
            </p>
          </div>
        ) : (
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

            {events.length > displayLimit && (
              <Button
                onClick={() => setShowFollowFeedSheet(true)}
                variant='ghost'
                className='mt-3 w-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
              >
                View All Events <ArrowRight className='h-4 w-4' />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Follow Feed Sheet */}
      <MasterScrollableSheet
        title='Follow Feed'
        open={showFollowFeedSheet}
        onOpenChange={setShowFollowFeedSheet}
      >
        <div className='flex flex-col gap-4 px-4 pb-8'>
          {groupedFollowingEvents.map((group) => (
            <div key={group.date} className='space-y-2'>
              <h3 className='text-sm font-medium text-gray-500'>{formatDateHeader(group.date)}</h3>
              <div className='flex flex-col gap-2'>
                {group.events.map((event) => (
                  <MasterEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
