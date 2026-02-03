'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useFollowingEvents } from '@/lib/hooks/use-following-events';
import { useForYouEvents } from '@/lib/hooks/use-for-you-events';
import { EventWithUser } from '@/lib/types/api';
import { formatDateHeader } from '@/lib/utils/date';
import { Calendar, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

type ForYouTabType = 'following' | 'discover';

export function ForYouSection() {
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

  // Discover shows up to 10, Following shows up to 5
  const displayLimit = activeTab === 'discover' ? 10 : 5;

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
      <SegmentedTabs
        align='left'
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ForYouTabType)}
        items={[
          {
            value: 'discover',
            label: 'Discover',
          },
          {
            value: 'following',
            label: 'Following',
          },
        ]}
        wrapperClassName='mt-2'
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

            {activeTab === 'following' && followingEvents.length > displayLimit && (
              <button
                onClick={() => setShowFollowFeedSheet(true)}
                aria-label='Open Follow Feed'
                className='relative flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:border-gray-300'
              >
                {/* Soft background gradient */}
                <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-red-50/70 via-transparent to-amber-50/70 opacity-80' />

                {/* Thumbnail placeholder with +count */}
                <div className='flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50'>
                  <span className='text-base font-semibold text-gray-600'>
                    +{followingEvents.length - displayLimit}
                  </span>
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between'>
                    <h4 className='line-clamp-1 font-medium text-gray-900'>Open Follow Feed</h4>
                  </div>
                  <div className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                    <Users className='h-3 w-3 text-red-500' />
                    <span>See all events from people you follow.</span>
                  </div>
                </div>
              </button>
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
