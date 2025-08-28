'use client';

import { EventCard } from '@/components/event-card';
import { EventDateGroup } from '@/components/event-date-group';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useEventsFeed } from '@/lib/hooks/use-events-feed';
import { useUserSearch } from '@/lib/hooks/use-search';
import { useRecentSearchesStore } from '@/lib/stores/recent-searches-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useViewModeStore } from '@/lib/stores/view-mode-store';
import { EventWithUser, UserDetails, UserSearchResult, VerificationStatus } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import debounce from 'lodash.debounce';
import {
  ArrowDownAZ,
  Bookmark,
  Calendar,
  Check,
  Clock,
  LayoutGrid,
  LayoutList,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function FeedPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [activeTab, setActiveTab] = useState('feed');
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set());
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [activeDetent, setActiveDetent] = useState(0);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc'>('date-desc');
  const router = useRouter();
  const pathname = usePathname();
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // View mode state from Zustand store
  const { feedViewMode, setFeedViewMode } = useViewModeStore();

  const userSearchMutation = useUserSearch();
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use the Zustand store for recent searches
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearchesStore();

  // Click away handler for sort menu
  const sortButtonRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of sort menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node) &&
        sortMenuOpen
      ) {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await userSearchMutation.mutateAsync(query);
        setSearchResults(results);

        // If we got results, add the first one to recent searches
        if (results.length > 0) {
          addRecentSearch(results[0]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchText(query);
    debouncedSearch(query);
  };

  // Define recent and suggested searches
  const suggestedSearches = [
    { icon: <Calendar className='h-4 w-4' />, text: 'Events this weekend' },
    { icon: <MapPin className='h-4 w-4' />, text: 'Events near me' },
    { icon: <Users className='h-4 w-4' />, text: 'Popular events' },
    { icon: <Clock className='h-4 w-4' />, text: 'Upcoming events' },
  ];

  // Toggle view mode function with useCallback to prevent infinite rerenders
  const toggleViewMode = useCallback(() => {
    const newMode = feedViewMode === 'card' ? 'compact' : 'card';
    setFeedViewMode(newMode);
  }, [feedViewMode, setFeedViewMode]);

  // Set TopBar content
  useEffect(() => {
    // Apply any existing configuration for this route
    applyRouteConfig(pathname);

    // Set configuration for this specific route
    setTopBarForRoute(pathname, {
      title: 'Feed',
      showAvatar: true,
      leftMode: 'menu',
      subtitle: '',
      centerMode: 'title',
      buttons: [
        {
          id: 'viewMode',
          icon: feedViewMode === 'card' ? LayoutList : LayoutGrid,
          onClick: toggleViewMode,
          label: feedViewMode === 'card' ? 'Switch to compact view' : 'Switch to card view',
        },
        {
          id: 'search',
          icon: Search,
          onClick: () => setShowSearchSheet(true),
          label: 'Search events',
        },
      ],
    });

    // Cleanup on unmount
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig, router, feedViewMode]);

  // Fetch events feed
  const { data: rawEvents = [], isLoading, error } = useEventsFeed();

  // Sort events based on sort option
  const events = useMemo(() => {
    if (!rawEvents.length) return [];

    return [...rawEvents].sort((a, b) => {
      const timeA = new Date(a.computed_start_date).getTime();
      const timeB = new Date(b.computed_start_date).getTime();

      return sortOption === 'date-asc' ? timeA - timeB : timeB - timeA;
    });
  }, [rawEvents, sortOption]);

  // Group events by date for chronological view
  const eventsByDate = useMemo(() => {
    if (!events?.length) return {};

    const groupedEvents: Record<string, EventWithUser[]> = {};

    events.forEach((event) => {
      // Extract just the date part (YYYY-MM-DD) for grouping
      const dateOnly = event.computed_start_date.split('T')[0];

      if (!groupedEvents[dateOnly]) {
        groupedEvents[dateOnly] = [];
      }

      groupedEvents[dateOnly].push(event);
    });

    // Sort each group by time, respecting the sort option
    Object.keys(groupedEvents).forEach((date) => {
      groupedEvents[date].sort((a, b) => {
        const timeA = new Date(a.computed_start_date).getTime();
        const timeB = new Date(b.computed_start_date).getTime();

        // Apply sort direction based on the selected option
        return sortOption === 'date-asc' ? timeA - timeB : timeB - timeA;
      });
    });

    return groupedEvents;
  }, [events]);

  // Get sorted dates for rendering
  const sortedDates = useMemo(() => {
    // Get all dates
    const dates = Object.keys(eventsByDate);

    // Sort dates based on the selected sort option
    return dates.sort((a, b) => {
      // For date-asc, use the default string sort (which works for ISO dates)
      // For date-desc, reverse the sort order
      return sortOption === 'date-asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [eventsByDate, sortOption]);

  // Mock saved lists - in real app this would come from API
  const [savedLists] = useState([
    { id: 1, name: 'Event toes', isDefault: true },
    { id: 2, name: 'Tokyo Adventures', isDefault: false },
    { id: 3, name: 'Food Experiences', isDefault: false },
  ]);

  const handleBookmark = (eventId: string) => {
    setSelectedEventId(eventId);

    // If only one list exists, save automatically
    if (savedLists.length === 1) {
      const newBookmarkedEvents = new Set(bookmarkedEvents);
      if (bookmarkedEvents.has(eventId)) {
        newBookmarkedEvents.delete(eventId);
        toast.success('Event removed from saved!');
      } else {
        newBookmarkedEvents.add(eventId);
        toast.success(`Event saved to "${savedLists[0].name}"!`);
      }
      setBookmarkedEvents(newBookmarkedEvents);
    } else {
      // Show modal to choose list
      setShowSaveModal(true);
    }
  };

  const handleSaveToList = (listId: number, listName: string) => {
    if (selectedEventId) {
      const newBookmarkedEvents = new Set(bookmarkedEvents);
      newBookmarkedEvents.add(selectedEventId);
      setBookmarkedEvents(newBookmarkedEvents);
      toast.success(`Event saved to "${listName}"!`);
    }
    setShowSaveModal(false);
    setSelectedEventId(null);
  };

  if (isLoading || isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Feed Content */}
      <div className='flex-1 overflow-y-auto pb-20'>
        {/* Feed Header with Sort and View Mode Toggle */}
        <div className='sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-2 shadow-sm'>
          {/* Sorting Button */}
          <div className='relative' ref={sortButtonRef}>
            <button
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
              className='flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200'
            >
              <ArrowDownAZ className='mr-1.5 h-3.5 w-3.5' />
              Sort
            </button>

            {sortMenuOpen && (
              <div className='absolute left-0 top-full mt-1 w-44 rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                <button
                  onClick={() => {
                    setSortOption('date-desc');
                    setSortMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-xs ${
                    sortOption === 'date-desc' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock className='mr-2 h-3.5 w-3.5' />
                  Newest first
                </button>
                <button
                  onClick={() => {
                    setSortOption('date-asc');
                    setSortMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-xs ${
                    sortOption === 'date-asc' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock className='mr-2 h-3.5 w-3.5' />
                  Oldest first
                </button>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className='flex items-center rounded-full bg-gray-100 p-1'>
            <button
              onClick={() => setFeedViewMode('card')}
              className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-all ${
                feedViewMode === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <LayoutGrid className='mr-1.5 h-3.5 w-3.5' />
              Card
            </button>
            <button
              onClick={() => setFeedViewMode('compact')}
              className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-all ${
                feedViewMode === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <LayoutList className='mr-1.5 h-3.5 w-3.5' />
              List
            </button>
          </div>
        </div>

        {error ? (
          <div className='flex flex-col items-center justify-center px-4 py-12'>
            <p className='mb-4 text-center text-gray-500'>
              Failed to load events. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant='outline'>
              Retry
            </Button>
          </div>
        ) : events.length === 0 && !isLoading ? (
          <div className='flex flex-col items-center justify-center px-4 py-12'>
            <p className='mb-2 text-center text-gray-500'>No events in your feed yet</p>
            <p className='text-center text-sm text-gray-400'>
              Follow other users or create your first event to see updates here
            </p>
          </div>
        ) : feedViewMode === 'compact' ? (
          // Compact chronological view
          <div className='space-y-6 px-4 pt-2'>
            {sortedDates.map((dateStr) => (
              <EventDateGroup
                key={dateStr}
                date={dateStr}
                events={eventsByDate[dateStr]}
                onBookmark={handleBookmark}
                bookmarkedEvents={bookmarkedEvents}
              />
            ))}
          </div>
        ) : (
          // Standard card view
          <div className='grid gap-6 px-4 pt-2'>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBookmark={handleBookmark}
                isBookmarked={bookmarkedEvents.has(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save to List Modal */}
      {showSaveModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
            <h3 className='mb-4 text-xl font-bold'>Save to List</h3>
            <div className='space-y-2'>
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSaveToList(list.id, list.name)}
                  className='flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100'>
                      <Bookmark className='h-4 w-4 text-red-600' />
                    </div>
                    <span className='font-medium'>{list.name}</span>
                    {list.isDefault && (
                      <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
                        Default
                      </span>
                    )}
                  </div>
                  <Check className='h-4 w-4 text-gray-400' />
                </button>
              ))}
            </div>
            <Button
              variant='outline'
              onClick={() => {
                setShowSaveModal(false);
                setSelectedEventId(null);
              }}
              className='mt-4 w-full'
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search Sheet */}
      <SheetWithDetent.Root
        presented={showSearchSheet}
        onPresentedChange={(presented) => !presented && setShowSearchSheet(false)}
        activeDetent={activeDetent}
        onActiveDetentChange={setActiveDetent}
      >
        <SheetWithDetent.Portal>
          <SheetWithDetent.View>
            <SheetWithDetent.Backdrop />
            <SheetWithDetent.Content className='rounded-t-2xl bg-white p-4'>
              <div className='mb-4 flex items-center'>
                <SheetWithDetent.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
              </div>

              {/* Search Input */}
              <div className='relative mb-6 flex items-center gap-3'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <input
                    type='text'
                    value={searchText}
                    onChange={handleSearchChange}
                    placeholder='Search events, people, places...'
                    className='w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
                    autoFocus
                    onFocus={() => setActiveDetent(2)}
                  />
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-full bg-gray-100'
                  onClick={() => {
                    setSearchText('');
                    setSearchResults([]);
                    setShowSearchSheet(false);
                  }}
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>

              <SheetWithDetent.ScrollRoot>
                <SheetWithDetent.ScrollView>
                  <SheetWithDetent.ScrollContent>
                    {/* Search Results */}
                    {searchText ? (
                      <div>
                        {isSearching ? (
                          // Loading state
                          <div className='flex justify-center py-6'>
                            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-red-500'></div>
                          </div>
                        ) : searchResults.length > 0 ? (
                          // Results
                          <div>
                            <h3 className='mb-4 text-sm font-semibold text-gray-900'>
                              Results for "{searchText}"
                            </h3>
                            <div className='space-y-2'>
                              {searchResults.map((user) => (
                                <div
                                  key={user.id}
                                  className='flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50'
                                  onClick={() => {
                                    // Add to recent searches when user is clicked
                                    addRecentSearch(user);
                                    setSelectedUser(user);
                                    setShowSearchSheet(false);
                                  }}
                                >
                                  <UserAvatar
                                    user={{
                                      name: user.name || undefined,
                                      username: user.username || undefined,
                                      image: user.image || undefined,
                                      verification_status:
                                        (user.verification_status as VerificationStatus) || null,
                                    }}
                                    size='sm'
                                  />
                                  <div className='min-w-0 flex-1'>
                                    <div className='truncate text-sm font-medium'>
                                      @{user.username}
                                    </div>
                                    <div className='truncate text-xs text-gray-500'>
                                      {user.name || user.username}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // No results
                          <div className='py-8 text-center'>
                            <p className='text-gray-500'>No results found for "{searchText}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Default state - show suggestions
                      <div className='space-y-6'>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div>
                            <div className='mb-3 flex items-center justify-between'>
                              <h3 className='text-sm font-semibold text-gray-900'>Recent</h3>
                              {recentSearches.length > 0 && (
                                <button
                                  onClick={clearRecentSearches}
                                  className='text-xs text-red-500 hover:text-red-600'
                                >
                                  Clear all
                                </button>
                              )}
                            </div>
                            <div className='space-y-2'>
                              {recentSearches.map((user) => (
                                <div
                                  key={user.id}
                                  className='flex cursor-pointer items-center gap-3 rounded-xl p-1 transition-colors hover:bg-gray-50'
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowSearchSheet(false);
                                  }}
                                >
                                  <UserAvatar
                                    user={{
                                      name: user.name || undefined,
                                      username: user.username || undefined,
                                      image: user.image || undefined,
                                      verification_status:
                                        (user.verification_status as VerificationStatus) || null,
                                    }}
                                    size='sm'
                                  />
                                  <div className='min-w-0 flex-1'>
                                    <div className='truncate text-sm font-medium'>
                                      @{user.username}
                                    </div>
                                    <div className='truncate text-xs text-gray-500'>
                                      {user.name || user.username}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Searches */}
                        <div>
                          <h3 className='mb-3 text-sm font-semibold text-gray-900'>Suggestions</h3>
                          <div className='space-y-2'>
                            {suggestedSearches.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchText(suggestion.text);
                                  debouncedSearch(suggestion.text);
                                }}
                                className='flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50'
                              >
                                <div className='text-gray-400'>{suggestion.icon}</div>
                                <span className='text-gray-700'>{suggestion.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trending */}
                        <div>
                          <h3 className='mb-3 text-sm font-semibold text-gray-900'>Trending</h3>
                          <div className='flex flex-wrap gap-2'>
                            {[
                              '#TokyoEvents',
                              '#FoodFestival',
                              '#Photography',
                              '#Sunset',
                              '#Travel',
                            ].map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchText(tag);
                                  debouncedSearch(tag);
                                }}
                                className='rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200'
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </SheetWithDetent.ScrollContent>
                </SheetWithDetent.ScrollView>
              </SheetWithDetent.ScrollRoot>
            </SheetWithDetent.Content>
          </SheetWithDetent.View>
        </SheetWithDetent.Portal>
      </SheetWithDetent.Root>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={{ ...selectedUser, bio: '' } as UserDetails}
        />
      )}
    </div>
  );
}
