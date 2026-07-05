'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkSubEvent } from '@/lib/hooks/use-link-sub-event';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { EventWithUser } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import debounce from 'lodash.debounce';
import { Link2, Search } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface LinkSubEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  parentEventId: string;
  /** IDs of events already linked as sub-events (excluded from the list) */
  linkedEventIds: string[];
}

type LinkableFilter = 'hosting' | 'drafts';

function LinkableEventRow({
  event,
  onLink,
  isLinking,
}: {
  event: EventWithUser;
  onLink: () => void;
  isLinking: boolean;
}) {
  const { date, timeWithTz } = formatEventDateFromParts({
    year: event.start_date_year,
    month: event.start_date_month,
    day: event.start_date_day,
    hours: event.start_date_hours,
    minutes: event.start_date_minutes,
    timezone: event.timezone,
    fallbackIso: event.computed_start_date,
  });

  return (
    <div className='flex items-center gap-3 rounded-xl border border-gray-100 p-2'>
      <div className='h-12 w-12 shrink-0 overflow-hidden rounded-lg'>
        <Image
          src={getEventCoverDisplayUrl(event.cover, 'feed')}
          alt={event.title}
          width={48}
          height={48}
          sizes='48px'
          className='h-full w-full object-cover'
        />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <h4 className='line-clamp-1 font-medium text-gray-900'>{event.title}</h4>
          {event.status === 'draft' && (
            <span className='shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'>
              Draft
            </span>
          )}
        </div>
        <p className='line-clamp-1 text-sm text-gray-500'>
          {date}
          {timeWithTz ? ` · ${timeWithTz}` : ''}
        </p>
      </div>
      <Button
        variant='outline'
        size='sm'
        className='shrink-0'
        onClick={onLink}
        disabled={isLinking}
      >
        <Link2 className='mr-1 h-4 w-4' />
        {isLinking ? 'Linking...' : 'Link'}
      </Button>
    </div>
  );
}

export default function LinkSubEventSheet({
  isOpen,
  onClose,
  parentEventId,
  linkedEventIds,
}: LinkSubEventSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<LinkableFilter>('hosting');
  const [linkingEventId, setLinkingEventId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const linkSubEvent = useLinkSubEvent();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchText);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText, debouncedSearch]);

  const hostingQuery = useUserEvents({
    search: searchQuery,
    filter: 'hosting',
    timeframe: 'all',
    sortBy: 'date-desc',
    limit: 10,
    enabled: isOpen && filter === 'hosting',
  });

  const draftsQuery = useMyDraftEvents({
    search: searchQuery,
    limit: 10,
    enabled: isOpen && filter === 'drafts',
  });

  const activeQuery = filter === 'drafts' ? draftsQuery : hostingQuery;

  const events = useMemo(() => {
    if (!activeQuery.data) return [];

    return activeQuery.data.pages
      .flatMap((page) => page.events)
      .filter(
        (event) =>
          event.id !== parentEventId && !linkedEventIds.includes(event.id) && !event.parent_event_id
      );
  }, [activeQuery.data, parentEventId, linkedEventIds]);

  const renderLoadMoreButton = (className?: string) => {
    if (!activeQuery.hasNextPage) return null;

    return (
      <div className={cn('flex justify-center', className)}>
        <Button
          variant='outline'
          size='sm'
          className='w-full max-w-[200px]'
          onClick={() => activeQuery.fetchNextPage()}
          disabled={activeQuery.isFetchingNextPage}
        >
          {activeQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
        </Button>
      </div>
    );
  };

  const handleLink = async (event: EventWithUser) => {
    setLinkingEventId(event.id);
    try {
      await linkSubEvent.mutateAsync({ parentEventId, subEventId: event.id });
      toast.success(`"${event.title}" linked as sub event`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to link sub event');
    } finally {
      setLinkingEventId(null);
    }
  };

  return (
    <MasterScrollableSheet
      title='Link Existing Event'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerSecondary={
        <div className='space-y-3 px-4 pb-4'>
          {/* Search Input */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              ref={searchInputRef}
              className='h-10 w-full rounded-full border-none bg-gray-100 px-10 py-0 text-sm text-gray-800 outline-none'
              type='text'
              placeholder='Search your events'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <div className='flex items-center rounded-full bg-gray-50 p-1'>
            <button
              onClick={() => setFilter('hosting')}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                filter === 'hosting'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Hosting
            </button>
            <button
              onClick={() => setFilter('drafts')}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                filter === 'drafts'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Drafts
            </button>
          </div>
        </div>
      }
      contentClassName='px-4 pb-6'
    >
      {activeQuery.isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className='flex items-center gap-3 rounded-xl border border-gray-100 p-2'
            >
              <Skeleton className='h-12 w-12 rounded-lg' />
              <div className='flex-1'>
                <Skeleton className='mb-2 h-4 w-2/3' />
                <Skeleton className='h-3 w-1/2' />
              </div>
              <Skeleton className='h-9 w-16 rounded-lg' />
            </div>
          ))}
        </div>
      ) : activeQuery.error ? (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center text-base text-gray-600'>Failed to load your events</div>
        </div>
      ) : events.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center text-base text-gray-600'>
            {activeQuery.hasNextPage
              ? 'No linkable events loaded yet'
              : searchText.trim()
                ? `No events found matching "${searchText}"`
                : 'No events available to link'}
          </div>
          <p className='mt-2 text-center text-sm text-gray-500'>
            {activeQuery.hasNextPage
              ? 'Load more to keep checking your remaining events.'
              : 'Only your own events without a parent event can be linked.'}
          </p>
          {renderLoadMoreButton('mt-4')}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {events.map((event) => (
            <LinkableEventRow
              key={event.id}
              event={event}
              onLink={() => handleLink(event)}
              isLinking={linkingEventId === event.id}
            />
          ))}

          {renderLoadMoreButton('pt-4')}
        </div>
      )}
    </MasterScrollableSheet>
  );
}
