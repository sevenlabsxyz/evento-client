'use client';

import { MasterEventCard } from '@/components/master-event-card';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EventFilterType,
  EventSortBy,
  EventTimeframe,
  useUserEvents,
} from '@/lib/hooks/use-user-events';
import { useAuth } from '@/lib/stores/auth-store';
import { EventWithUser } from '@/lib/types/api';
import debounce from 'lodash.debounce';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Calendar,
  ChevronDown,
  History,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SheetWithDetentFull } from './ui/sheet-with-detent-full';

interface EventSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onPin?: (eventId: string, isPinned: boolean) => void;
  pinnedEventId?: string;
  isOwnProfile?: boolean;
  initialFilter?: EventFilterType;
}

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
  const [filter, setFilter] = useState<EventFilterType>(initialFilter ?? 'upcoming');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('future');
  const [sortBy, setSortBy] = useState<EventSortBy>('date-desc');
  const [timeframePopoverOpen, setTimeframePopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const { user } = useAuth();
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

  // Fetch user events with filters and search
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserEvents({
    username,
    search: searchQuery,
    filter,
    timeframe,
    sortBy,
    limit: 10,
    enabled: isOpen,
  });

  // Extract events from infinite query data
  const events = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.events);
  }, [data]);

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

  // Check if user can pin an event (creator only)
  const canPinEvent = (event: EventWithUser) => {
    if (!isOwnProfile || !user?.id) return false;

    // Allow pinning if the user is the creator
    return event.user_details.id === user.id;
  };

  // Toggle filter type
  const handleFilterChange = (newFilter: EventFilterType) => {
    setFilter(newFilter);
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='flex w-full max-w-full flex-col sm:mx-auto sm:overflow-hidden sm:rounded-2xl md:max-w-sm'>
            <div className='sticky top-0 z-10 border-b border-gray-200 bg-white p-4 px-5'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle className='mx-auto mb-4 h-[5px] w-9 rounded-[2.5px] bg-gray-300' />
              </div>
              <SheetWithDetentFull.Title className='mb-2 text-lg font-semibold'>
                Events
              </SheetWithDetentFull.Title>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input
                  className='h-10 w-full rounded-full border-none bg-gray-100 px-10 py-0 text-sm text-gray-800 outline-none'
                  type='text'
                  placeholder='Search events'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Filter Tabs */}
              <SegmentedTabs
                items={[
                  { value: 'upcoming', label: 'All' },
                  { value: 'attending', label: 'Attending' },
                  { value: 'hosting', label: 'Hosting' },
                ]}
                value={filter}
                onValueChange={(v) => handleFilterChange(v as EventFilterType)}
                wrapperClassName='py-3 px-0'
                align='left'
              />

              {/* Time/Sort Controls */}
              <ButtonGroup className='w-full pb-2'>
                <Popover open={timeframePopoverOpen} onOpenChange={setTimeframePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='rounded-l-full rounded-r-none bg-white hover:bg-gray-50'
                    >
                      {timeframe === 'future' ? 'Upcoming' : 'Past'}
                      <ChevronDown className='ml-1 h-3 w-3' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align='start' className='w-56 p-2'>
                    <button
                      className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                      onClick={() => {
                        setTimeframe('future');
                        setTimeframePopoverOpen(false);
                      }}
                    >
                      <Calendar className='mt-0.5 h-4 w-4 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium'>Upcoming</div>
                        <div className='text-xs text-gray-500'>Events happening soon</div>
                      </div>
                    </button>
                    <button
                      className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                      onClick={() => {
                        setTimeframe('past');
                        setTimeframePopoverOpen(false);
                      }}
                    >
                      <History className='mt-0.5 h-4 w-4 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium'>Past</div>
                        <div className='text-xs text-gray-500'>Events that have ended</div>
                      </div>
                    </button>
                  </PopoverContent>
                </Popover>

                <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='rounded-l-none rounded-r-full bg-white hover:bg-gray-50'
                    >
                      {sortBy === 'date-desc' ? 'Latest' : 'Oldest'}
                      <ChevronDown className='ml-1 h-3 w-3' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align='start' className='w-56 p-2'>
                    <button
                      className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                      onClick={() => {
                        setSortBy('date-desc');
                        setSortPopoverOpen(false);
                      }}
                    >
                      <ArrowDownWideNarrow className='mt-0.5 h-4 w-4 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium'>Latest</div>
                        <div className='text-xs text-gray-500'>Most recent events first</div>
                      </div>
                    </button>
                    <button
                      className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                      onClick={() => {
                        setSortBy('date-asc');
                        setSortPopoverOpen(false);
                      }}
                    >
                      <ArrowUpWideNarrow className='mt-0.5 h-4 w-4 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium'>Oldest</div>
                        <div className='text-xs text-gray-500'>Oldest events first</div>
                      </div>
                    </button>
                  </PopoverContent>
                </Popover>
              </ButtonGroup>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='pb-safe flex-1 overflow-y-auto'>
                <SheetWithDetentFull.ScrollContent className='px-0 py-0 pb-6'>
                  {isLoading ? (
                    // Loading State
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`loading-${index}`}
                        className='border-b border-gray-100 last:border-b-0'
                      >
                        <Skeleton variant='event-compact-item' />
                      </div>
                    ))
                  ) : error ? (
                    // Error State
                    <div className='flex flex-col items-center justify-center px-4 py-12'>
                      <div className='mt-4 text-center text-base text-gray-600'>
                        Failed to load events
                      </div>
                    </div>
                  ) : events.length === 0 ? (
                    // Empty State
                    <div className='flex flex-col items-center justify-center px-4 py-12'>
                      <div className='mt-4 text-center text-base text-gray-600'>
                        {searchText.trim()
                          ? `No events found matching "${searchText}"`
                          : `No ${filter} events found`}
                      </div>
                    </div>
                  ) : (
                    // Events List
                    <>
                      {events.map((event) => (
                        <div key={event.id} className='px-4 py-2'>
                          <MasterEventCard event={event} />
                        </div>
                      ))}

                      {hasNextPage && (
                        <div className='flex justify-center p-4'>
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
                    </>
                  )}
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
