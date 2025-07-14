"use client";

import {
  Search,
  Check,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Navbar } from "@/components/navbar";
import { EventCard } from "@/components/event-card";
import { useEventsFeed } from "@/lib/hooks/useEventsFeed";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(
    new Set()
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-40 border-b border-gray-100">
          <PageHeader
            title="Feed"
            subtitle="Discover amazing travel events"
            rightContent={
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-100"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </>
            }
          />
        </div>
        <div className="flex-1 flex items-center justify-center pt-[120px] pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-40 border-b border-gray-100">
        <PageHeader
          title="Feed"
          subtitle="Discover amazing travel events"
          rightContent={
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
                onClick={() => router.push("/e/search")}
              >
                <Search className="h-5 w-5" />
              </Button>
            </>
          }
        />
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pt-[120px] pb-20">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center mb-4">
              Failed to load events. Please try again.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
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
