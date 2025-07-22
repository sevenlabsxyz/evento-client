'use client';

import { EventCard } from '@/components/event-card';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useEventsFeed } from '@/lib/hooks/useEventsFeed';
import { useUserSearch } from '@/lib/hooks/useSearch';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useRecentSearchesStore } from '@/lib/stores/recent-searches-store';
import { UserSearchResult } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import debounce from 'lodash.debounce';
import {
  BadgeCheck,
  Bookmark,
  Calendar,
  Check,
  Clock,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function FeedPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [activeTab, setActiveTab] = useState('feed');
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(
    new Set()
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [activeDetent, setActiveDetent] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const userSearchMutation = useUserSearch();
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use the Zustand store for recent searches
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearchesStore();

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
    { icon: <Calendar className="h-4 w-4" />, text: 'Events this weekend' },
    { icon: <MapPin className="h-4 w-4" />, text: 'Events near me' },
    { icon: <Users className="h-4 w-4" />, text: 'Popular events' },
    { icon: <Clock className="h-4 w-4" />, text: 'Upcoming events' },
  ];

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
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig, router]);

  // Fetch events feed
  const { data: events = [], isLoading, error } = useEventsFeed();

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
      <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
        <div className="flex flex-1 items-center justify-center pb-20">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {error ? (
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <p className="mb-4 text-center text-gray-500">
              Failed to load events. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : events.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center px-4 py-12">
            <p className="mb-2 text-center text-gray-500">
              No events in your feed yet
            </p>
            <p className="text-center text-sm text-gray-400">
              Follow other users or create your first event to see updates here
            </p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onBookmark={handleBookmark}
              isBookmarked={bookmarkedEvents.has(event.id)}
            />
          ))
        )}
      </div>

      {/* Save to List Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm">
            <h3 className="mb-4 text-xl font-bold">Save to List</h3>
            <div className="space-y-2">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSaveToList(list.id, list.name)}
                  className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <Bookmark className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">{list.name}</span>
                    {list.isDefault && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Default
                      </span>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveModal(false);
                setSelectedEventId(null);
              }}
              className="mt-4 w-full"
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
        onPresentedChange={(presented) =>
          !presented && setShowSearchSheet(false)
        }
        activeDetent={activeDetent}
        onActiveDetentChange={setActiveDetent}
      >
        <SheetWithDetent.Portal>
          <SheetWithDetent.View>
            <SheetWithDetent.Backdrop />
            <SheetWithDetent.Content className="rounded-t-2xl bg-white p-4">
              <div className="flex items-center mb-4">
                <SheetWithDetent.Handle className="mx-auto h-1 w-12 rounded-full bg-gray-300" />
              </div>

              {/* Search Input */}
              <div className="relative mb-6 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={handleSearchChange}
                    placeholder="Search events, people, places..."
                    className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                    onFocus={() => setActiveDetent(2)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-100"
                  onClick={() => {
                    setSearchText('');
                    setSearchResults([]);
                    setShowSearchSheet(false);
                  }}
                >
                  <X className="h-5 w-5" />
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
                          <div className="flex justify-center py-6">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-red-500"></div>
                          </div>
                        ) : searchResults.length > 0 ? (
                          // Results
                          <div>
                            <h3 className="mb-4 text-sm font-semibold text-gray-900">
                              Results for "{searchText}"
                            </h3>
                            <div className="space-y-3">
                              {searchResults.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                                  onClick={() => {
                                    // Add to recent searches when user is clicked
                                    addRecentSearch(user);
                                    router.push(`/${user.username}`);
                                    setShowSearchSheet(false);
                                  }}
                                >
                                  <img
                                    src={
                                      user.image ||
                                      '/placeholder.svg?height=60&width=60'
                                    }
                                    alt={user.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-medium text-gray-900">
                                      {user.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <span className="text-gray-400">
                                        @{user.username}
                                      </span>
                                      {user.verification_status ===
                                        'verified' && (
                                        <span className="ml-1">
                                          <BadgeCheck className="h-3 w-3 rounded-full bg-red-600 text-white shadow-sm" />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // No results
                          <div className="py-8 text-center">
                            <p className="text-gray-500">
                              No results found for "{searchText}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Default state - show suggestions
                      <div className="space-y-6">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">
                                Recent
                              </h3>
                              {recentSearches.length > 0 && (
                                <button
                                  onClick={clearRecentSearches}
                                  className="text-xs text-red-500 hover:text-red-600"
                                >
                                  Clear all
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {recentSearches.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                                  onClick={() => {
                                    router.push(`/${user.username}`);
                                    setShowSearchSheet(false);
                                  }}
                                >
                                  <img
                                    src={
                                      user.image ||
                                      '/placeholder.svg?height=60&width=60'
                                    }
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h4 className="truncate font-medium text-gray-900">
                                      {user.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <span className="text-gray-400">
                                        @{user.username}
                                      </span>
                                      {user.verification_status ===
                                        'verified' && (
                                        <span className="ml-1">
                                          <BadgeCheck className="h-3 w-3 rounded-full bg-red-600 text-white shadow-sm" />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Searches */}
                        <div>
                          <h3 className="mb-3 text-sm font-semibold text-gray-900">
                            Suggestions
                          </h3>
                          <div className="space-y-2">
                            {suggestedSearches.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSearchText(suggestion.text);
                                  debouncedSearch(suggestion.text);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
                              >
                                <div className="text-gray-400">
                                  {suggestion.icon}
                                </div>
                                <span className="text-gray-700">
                                  {suggestion.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trending */}
                        <div>
                          <h3 className="mb-3 text-sm font-semibold text-gray-900">
                            Trending
                          </h3>
                          <div className="flex flex-wrap gap-2">
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
                                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
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
    </div>
  );
}
