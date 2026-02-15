'use client';

import { MasterEventCard } from '@/components/master-event-card';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { usePublicUserEvents } from '@/lib/hooks/use-public-user-events';
import {
  EventFilterType,
  EventSortBy,
  EventTimeframe,
  useUserEvents,
} from '@/lib/hooks/use-user-events';
import { cn } from '@/lib/utils';
import { formatDateHeader } from '@/lib/utils/date';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function hasValidEventDate(eventDate: unknown): eventDate is string {
  return typeof eventDate === 'string' && eventDate.trim().length > 0;
}

interface EventSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onPin?: (eventId: string, isPinned: boolean) => void;
  pinnedEventId?: string;
  isOwnProfile?: boolean;
  initialFilter?: EventFilterType | 'drafts';
}

type EventSearchFilter = EventFilterType | 'drafts';

export default function EventSearchSheet({
  isOpen,
  onClose,
  username,
  onPin,
  pinnedEventId,
  isOwnProfile = false,
  initialFilter,
}: EventSearchSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<EventSearchFilter>(initialFilter ?? 'upcoming');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('future');
  const [sortBy, setSortBy] = useState<EventSortBy>('date-desc');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Update search query when searchText changes
  useEffect(() => {
    debouncedSearch(searchText);
    // Cleanup debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText, debouncedSearch]);

  // Focus search input when sheet opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small timeout to ensure the sheet is fully open
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync filter from parent when opening or when prop changes
  useEffect(() => {
    if (isOpen && initialFilter) {
      setFilter(initialFilter);
    }
  }, [isOpen, initialFilter]);

  // Fetch events for own profile (with server-side filtering)
  const ownProfileQuery = useUserEvents({
    search: searchQuery,
    filter: filter === 'drafts' ? 'upcoming' : filter,
    timeframe,
    sortBy,
    limit: 10,
    enabled: isOpen && isOwnProfile && filter !== 'drafts',
  });

  const ownDraftsQuery = useMyDraftEvents({
    search: searchQuery,
    limit: 10,
    enabled: isOpen && isOwnProfile && filter === 'drafts',
  });

  // Fetch events for other user's profile (client-side filtering)
  const otherUserQuery = usePublicUserEvents({
    username: username || '',
    enabled: isOpen && !isOwnProfile && !!username,
  });

  // Select the appropriate query data
  const activeOwnQuery = filter === 'drafts' ? ownDraftsQuery : ownProfileQuery;
  const isLoading = isOwnProfile ? activeOwnQuery.isLoading : otherUserQuery.isLoading;
  const error = isOwnProfile ? activeOwnQuery.error : otherUserQuery.error;
  const hasNextPage = isOwnProfile ? activeOwnQuery.hasNextPage : false;
  const isFetchingNextPage = isOwnProfile ? activeOwnQuery.isFetchingNextPage : false;
  const fetchNextPage = activeOwnQuery.fetchNextPage;

  // Extract and filter events
  const events = useMemo(() => {
    if (isOwnProfile) {
      // Own profile: events come from paginated data (server already filtered)
      if (!activeOwnQuery.data) return [];
      return activeOwnQuery.data.pages.flatMap((page) => page.events);
    } else {
      // Other user: events come as array, need client-side filtering
      if (!otherUserQuery.data) return [];
      let filteredEvents = [...otherUserQuery.data];

      // Filter by timeframe
      const today = new Date().toISOString().slice(0, 10);
      if (timeframe === 'future') {
        filteredEvents = filteredEvents.filter(
          (e) => hasValidEventDate(e.computed_start_date) && e.computed_start_date >= today
        );
      } else if (timeframe === 'past') {
        filteredEvents = filteredEvents.filter(
          (e) => hasValidEventDate(e.computed_start_date) && e.computed_start_date < today
        );
      }

      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(
          (e) =>
            e.title?.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query)
        );
      }

      // Sort
      filteredEvents.sort((a, b) => {
        const dateA = hasValidEventDate(a.computed_start_date)
          ? new Date(a.computed_start_date).getTime()
          : 0;
        const dateB = hasValidEventDate(b.computed_start_date)
          ? new Date(b.computed_start_date).getTime()
          : 0;
        return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
      });

      return filteredEvents;
    }
  }, [isOwnProfile, activeOwnQuery.data, otherUserQuery.data, timeframe, searchQuery, sortBy]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    return events.reduce((groups: { date: string; events: typeof events }[], event) => {
      if (!hasValidEventDate(event.computed_start_date)) {
        return groups;
      }

      const date = event.computed_start_date.slice(0, 10); // Extract YYYY-MM-DD
      const group = groups.find((g) => g.date === date);

      if (group) {
        group.events.push(event);
      } else {
        groups.push({ date, events: [event] });
      }

      return groups;
    }, []);
  }, [events]);

  // Auto-load more with IntersectionObserver
  useEffect(() => {
    if (!isOpen) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Toggle filter type
  const handleFilterChange = (newFilter: EventSearchFilter) => {
    setFilter(newFilter);
  };

  return (
    <MasterScrollableSheet
      title='Events'
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
              placeholder='Search events'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Filter Tabs - only show for own profile */}
          {isOwnProfile && (
            <SegmentedTabs
              items={[
                { value: 'upcoming', label: 'All' },
                { value: 'attending', label: 'Attending' },
                { value: 'hosting', label: 'Hosting' },
                { value: 'drafts', label: 'Drafts' },
              ]}
              value={filter}
              onValueChange={(v) => handleFilterChange(v as EventSearchFilter)}
              wrapperClassName='py-0 px-0'
              align='left'
            />
          )}

          {/* Timeframe & Sort Toggles */}
          {filter !== 'drafts' && (
            <div className='flex items-center gap-2'>
              {/* Timeframe Toggle */}
              <div className='flex items-center rounded-full bg-gray-50 p-1'>
                <button
                  onClick={() => setTimeframe('future')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    timeframe === 'future'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setTimeframe('past')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    timeframe === 'past'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Past
                </button>
              </div>

              {/* Sort Toggle */}
              <div className='flex items-center rounded-full bg-gray-50 p-1'>
                <button
                  onClick={() => setSortBy('date-desc')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    sortBy === 'date-desc'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('date-asc')}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    sortBy === 'date-asc'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Oldest
                </button>
              </div>
            </div>
          )}
        </div>
      }
      contentClassName='px-4 pb-6 !max-w-[100vw]'
    >
      {isLoading ? (
        // Loading State
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`loading-${index}`} variant='event-compact-item' />
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center text-base text-gray-600'>Failed to load events</div>
        </div>
      ) : events.length === 0 ? (
        // Empty State
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-center text-base text-gray-600'>
            {searchText.trim()
              ? `No events found matching "${searchText}"`
              : `No ${filter} events found`}
          </div>
        </div>
      ) : (
        // Events List
        <div className='flex w-full min-w-0 flex-col gap-4'>
          {groupedEvents.map((group) => (
            <div key={group.date} className='space-y-2'>
              <h3 className='text-sm font-medium text-gray-500'>{formatDateHeader(group.date)}</h3>
              <div className='flex flex-col gap-2'>
                {group.events.map((event) => (
                  <MasterEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div className='flex justify-center pt-4'>
              <Button
                variant='outline'
                size='sm'
                className='w-full max-w-[200px]'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}

          {/* Sentinel for infinite scrolling */}
          <div ref={loadMoreRef} className='h-1 w-full' />
        </div>
      )}
    </MasterScrollableSheet>
  );
}
