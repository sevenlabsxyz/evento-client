"use client";

import { EventCard } from "@/components/event-card";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/hooks/useAuth";
import { useEventsFeed } from "@/lib/hooks/useEventsFeed";
import { useTopBar } from "@/lib/stores/topbar-store";
import { toast } from "@/lib/utils/toast";
import { Bookmark, Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeedPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBar } = useTopBar();
  const [activeTab, setActiveTab] = useState("feed");
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(
    new Set()
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const router = useRouter();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: "Feed",
      showAvatar: true,
      leftMode: "menu",
      subtitle: undefined,
      buttons: [
        {
          id: "search",
          icon: Search,
          onClick: () => router.push("/e/search"),
          label: "Search events",
        },
      ],
    });

    return () => {
      setTopBar({ buttons: [] });
    };
  }, [router, setTopBar]);

  // Fetch events feed
  const { data: events = [], isLoading, error } = useEventsFeed();

  // Mock saved lists - in real app this would come from API
  const [savedLists] = useState([
    { id: 1, name: "Event toes", isDefault: true },
    { id: 2, name: "Tokyo Adventures", isDefault: false },
    { id: 3, name: "Food Experiences", isDefault: false },
  ]);

  const handleBookmark = (eventId: string) => {
    setSelectedEventId(eventId);

    // If only one list exists, save automatically
    if (savedLists.length === 1) {
      const newBookmarkedEvents = new Set(bookmarkedEvents);
      if (bookmarkedEvents.has(eventId)) {
        newBookmarkedEvents.delete(eventId);
        toast.success("Event removed from saved!");
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
    </div>
  );
}
