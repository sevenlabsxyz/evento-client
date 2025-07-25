'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import { Button } from '@/components/ui/button';
import { EventFilterType, useUserEvents } from '@/lib/hooks/useUserEvents';
import { useAuth } from '@/lib/stores/auth-store';
import { EventWithUser } from '@/lib/types/api';
import { Search, SortAsc } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SheetWithDetentFull } from '../ui/sheet-with-detent-full';

interface EventSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  onPin?: (eventId: string, isPinned: boolean) => void;
  pinnedEventId?: string;
  isOwnProfile?: boolean;
}

export default function EventSearchSheet({
  isOpen,
  onClose,
  username,
  onPin,
  pinnedEventId,
  isOwnProfile = false,
}: EventSearchSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<EventFilterType>('upcoming');
  const [sortDesc, setSortDesc] = useState(true);
  const { user } = useAuth();

  // Fetch user events with filters and search
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserEvents({
    username,
    search: searchText,
    filter,
    sortBy: sortDesc ? 'date-desc' : 'date-asc',
    limit: 10,
    enabled: isOpen,
  });

  // Extract events from infinite query data
  const events = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.events);
  }, [data]);

  // Check if user can pin an event (if they're the creator or co-host)
  const canPinEvent = (event: EventWithUser) => {
    if (!isOwnProfile || !user?.id) return false;

    // Check if user is the creator
    if (event.user_details.id === user.id) return true;

    // Check if user is a co-host
    const isCoHost = event.hosts?.some((host) => host.id === user.id);
    return !!isCoHost;
  };

  // Toggle filter type
  const handleFilterChange = (newFilter: EventFilterType) => {
    setFilter(newFilter);
  };

  // Toggle sort order
  const handleSortToggle = () => {
    setSortDesc(!sortDesc);
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className="flex flex-col w-full md:max-w-sm max-w-full sm:rounded-2xl sm:overflow-hidden sm:mx-auto">
            <div className="p-4 px-5 bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-center items-center">
                <SheetWithDetentFull.Handle className="w-9 h-[5px] rounded-[2.5px] bg-gray-300 mx-auto mb-4" />
              </div>
              <SheetWithDetentFull.Title className="text-lg font-semibold mb-2">
                Events
              </SheetWithDetentFull.Title>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="px-10 py-0 w-full h-10 rounded-full bg-gray-100 border-none outline-none text-sm text-gray-800"
                  type="text"
                  placeholder="Search events"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 py-3 px-4 overflow-x-auto scrollbar-hide whitespace-nowrap">
                <button
                  className={`${
                    filter === 'upcoming'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  } rounded-2xl py-1.5 px-3 text-sm font-medium cursor-pointer`}
                  onClick={() => handleFilterChange('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={`${
                    filter === 'attending'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  } rounded-2xl py-1.5 px-3 text-sm font-medium cursor-pointer`}
                  onClick={() => handleFilterChange('attending')}
                >
                  Attending
                </button>
                <button
                  className={`${
                    filter === 'hosting'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  } rounded-2xl py-1.5 px-3 text-sm font-medium cursor-pointer`}
                  onClick={() => handleFilterChange('hosting')}
                >
                  Hosting
                </button>
                <button
                  className="flex items-center gap-1 bg-gray-100 text-gray-600 border-none rounded-2xl py-1.5 px-3 text-sm font-medium whitespace-nowrap cursor-pointer"
                  onClick={handleSortToggle}
                >
                  <SortAsc className="h-3 w-3" />
                  {sortDesc ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className="flex-1 overflow-y-auto pb-safe">
                <SheetWithDetentFull.ScrollContent className="py-0 px-0 pb-6">
                  {isLoading ? (
                    // Loading State
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`loading-${index}`}
                        className="flex p-4 items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gray-100" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-3 w-4/5 rounded-md bg-gray-100" />
                          <div className="h-3 w-3/5 rounded-md bg-gray-100" />
                        </div>
                      </div>
                    ))
                  ) : error ? (
                    // Error State
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-gray-600 text-base text-center mt-4">
                        Failed to load events
                      </div>
                    </div>
                  ) : events.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-gray-600 text-base text-center mt-4">
                        {searchText.trim()
                          ? `No events found matching "${searchText}"`
                          : `No ${filter} events found`}
                      </div>
                    </div>
                  ) : (
                    // Events List
                    <>
                      {events.map((event) => {
                        const isPinned = pinnedEventId === event.id;
                        const canPin = canPinEvent(event);

                        return (
                          <div
                            key={event.id}
                            className="border-b border-gray-100 last:border-b-0"
                          >
                            <EventCompactItem
                              event={event}
                              onBookmark={() => {}}
                              isPinned={isPinned}
                              canPin={canPin}
                              onPin={onPin}
                            />
                          </div>
                        );
                      })}

                      {hasNextPage && (
                        <div className="flex justify-center p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full max-w-[200px]"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                          >
                            {isFetchingNextPage ? 'Loading...' : 'Load more'}
                          </Button>
                        </div>
                      )}
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
