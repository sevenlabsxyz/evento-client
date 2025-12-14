'use client';

import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useFollowingEvents } from '@/lib/hooks/use-following-events';
import { useForYouEvents } from '@/lib/hooks/use-for-you-events';
import { Calendar, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MasterEventCard } from '../master-event-card';

type ForYouTabType = 'following' | 'discover';

export function ForYouSection() {
  const [activeTab, setActiveTab] = useState<ForYouTabType>('discover');
  const [loadedTabs, setLoadedTabs] = useState<ForYouTabType[]>(['discover']);

  // Only load data for tabs that have been opened
  const followingQuery = useFollowingEvents({
    limit: 10,
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
  // Following uses infinite query (pages), For You uses simple query (flat array)
  const events =
    activeTab === 'discover'
      ? discoverQuery.data || []
      : followingQuery.data?.pages?.[0]?.events || [];
  const isLoading = currentQuery.isLoading;

  const ctaLabel = useMemo(() => {
    if (activeTab === 'following') return 'View All Following Events';
    return 'View All Discover Events';
  }, [activeTab]);

  const getTabCount = (tab: ForYouTabType) => {
    switch (tab) {
      case 'following':
        return followingQuery.data?.pages?.[0]?.pagination.totalCount || 0;
      case 'discover':
        // For You events are not paginated, return array length
        return discoverQuery.data?.length || 0;
      default:
        return 0;
    }
  };

  const totalCount = useMemo(
    () => getTabCount(activeTab),
    [activeTab, followingQuery.data, discoverQuery.data]
  );

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
          <div className='flex flex-col gap-2'>
            {events.slice(0, 10).map((event) => (
              <MasterEventCard key={event.id} event={event} />
            ))}

            {activeTab === 'following' && totalCount > events.length && (
              <button
                onClick={() => {
                  // TODO: Open full-screen view all modal
                  console.log('View all clicked for:', activeTab);
                }}
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
                  <div className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                    <Sparkles className='h-3 w-3 text-amber-500' />
                    <span>Explore the full list of {activeTab} events.</span>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
