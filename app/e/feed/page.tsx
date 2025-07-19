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
      subtitle: "Your personalized event feed",
      rightContent: (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-gray-100"
          onClick={() => router.push("/e/search")}
        >
          <Search className="h-5 w-5" />
        </Button>
      ),
    });

    return () => {
      setTopBar({ rightContent: null });
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
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center mb-4">
              Failed to load events. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : events.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center mb-2">
              No events in your feed yet
            </p>
            <p className="text-sm text-gray-400 text-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full md:max-w-sm max-w-full">
            <h3 className="text-xl font-bold mb-4">Save to List</h3>
            <div className="space-y-2">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSaveToList(list.id, list.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Bookmark className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">{list.name}</span>
                    {list.isDefault && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
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
              className="w-full mt-4"
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
