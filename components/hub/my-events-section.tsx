'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventFilterType, useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { ArrowRight, Calendar, Grid3X3, List, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EventCard } from '../event-card';

type ViewMode = 'card' | 'list';

export function MyEventsSection() {
  const router = useRouter();
  const { user } = useUserProfile();
  const [activeTab, setActiveTab] = useState<EventFilterType>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [loadedTabs, setLoadedTabs] = useState<EventFilterType[]>(['upcoming']);

  // Only load data for tabs that have been opened
  const upcomingQuery = useUserEvents({
    username: user?.username,
    filter: 'upcoming',
    limit: 6,
    enabled: loadedTabs.includes('upcoming'),
  });

  const hostingQuery = useUserEvents({
    username: user?.username,
    filter: 'hosting',
    limit: 6,
    enabled: loadedTabs.includes('hosting'),
  });

  const attendingQuery = useUserEvents({
    username: user?.username,
    filter: 'attending',
    limit: 6,
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

  const getTabCount = (tab: EventFilterType) => {
    switch (tab) {
      case 'upcoming':
        return upcomingQuery.data?.pages?.[0]?.pagination?.totalCount || 0;
      case 'hosting':
        return hostingQuery.data?.pages?.[0]?.pagination?.totalCount || 0;
      case 'attending':
        return attendingQuery.data?.pages?.[0]?.pagination?.totalCount || 0;
      default:
        return 0;
    }
  };

  const handleCreateEvent = () => {
    router.push('/e/create');
  };

  const handleViewAll = () => {
    router.push('/e/profile?tab=events');
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>My Events</h2>
        <div className='flex items-center gap-2'>
          {/* View Toggle */}
          <div className='flex rounded-lg border border-gray-200 p-1'>
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'card'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label='Card view'
            >
              <Grid3X3 className='h-4 w-4' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label='List view'
            >
              <List className='h-4 w-4' />
            </button>
          </div>

          {/* Create Event Button */}
          <Button onClick={handleCreateEvent} size='sm' className='bg-red-500 hover:bg-red-600'>
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EventFilterType)}>
        <TabsList className='mb-4 grid w-full grid-cols-3 bg-gray-100'>
          <TabsTrigger value='upcoming' className='text-sm'>
            Upcoming{' '}
            {loadedTabs.includes('upcoming') &&
              getTabCount('upcoming') > 0 &&
              `(${getTabCount('upcoming')})`}
          </TabsTrigger>
          <TabsTrigger value='hosting' className='text-sm'>
            Hosting{' '}
            {loadedTabs.includes('hosting') &&
              getTabCount('hosting') > 0 &&
              `(${getTabCount('hosting')})`}
          </TabsTrigger>
          <TabsTrigger value='attending' className='text-sm'>
            Attending{' '}
            {loadedTabs.includes('attending') &&
              getTabCount('attending') > 0 &&
              `(${getTabCount('attending')})`}
          </TabsTrigger>
        </TabsList>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='h-20 animate-pulse rounded-lg bg-gray-100' />
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
              {activeTab !== 'attending' && (
                <Button
                  onClick={handleCreateEvent}
                  size='sm'
                  className='bg-red-500 hover:bg-red-600'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create Event
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  viewMode === 'card' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'space-y-2'
                )}
              >
                {events.slice(0, 6).map((event) => {
                  if (viewMode === 'card') {
                    return (
                      <div key={event.id} className='overflow-hidden rounded-2xl'>
                        <EventCard event={event} />
                      </div>
                    );
                  } else {
                    return (
                      <div key={event.id} className='overflow-hidden rounded-lg'>
                        <EventCompactItem event={event} />
                      </div>
                    );
                  }
                })}
              </div>

              {/* View All Button */}
              {events.length > 0 && (
                <div className='mt-4 text-center'>
                  <Button
                    onClick={handleViewAll}
                    variant='outline'
                    size='sm'
                    className='text-gray-600 hover:text-gray-900'
                  >
                    View All Events <ArrowRight className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
