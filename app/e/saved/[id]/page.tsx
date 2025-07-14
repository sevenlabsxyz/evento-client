"use client";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SavedListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [savedEvents, setSavedEvents] = useState([
    {
      id: 1,
      title: "Eiffel Tower Night Photography",
      date: "Sep 20, 2025",
      time: "7:00 PM",
      location: "Paris, France",
      image: "/placeholder.svg?height=120&width=120",
      savedDate: "2 days ago",
    },
    {
      id: 2,
      title: "Tokyo Skytree Sunset Experience",
      date: "Sep 15, 2025",
      time: "6:30 PM",
      location: "Tokyo, Japan",
      image: "/placeholder.svg?height=120&width=120",
      savedDate: "1 week ago",
    },
    {
      id: 3,
      title: "Tegallalang Rice Terraces Tour",
      date: "Sep 18, 2025",
      time: "9:00 AM",
      location: "Bali, Indonesia",
      image: "/placeholder.svg?height=120&width=120",
      savedDate: "3 days ago",
    },
  ]);

  // Mock list data - in real app this would come from API based on params.id
  const listData = {
    "1": { name: "Event toes", isDefault: true },
    "2": { name: "Tokyo Adventures", isDefault: false },
    "3": { name: "Food Experiences", isDefault: false },
  };

  const currentList = listData[params.id as keyof typeof listData] || listData["1"];

  const handleUnsaveEvent = (eventId: number) => {
    setSavedEvents(savedEvents.filter((event) => event.id !== eventId));
    toast.success("Event removed from list!");
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{currentList.name}</h1>
            {currentList.isDefault && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {savedEvents.length} events saved
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-gray-100"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {savedEvents.length > 0 ? (
          <div className="px-4 py-4 space-y-4">
            {savedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Event Image */}
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                    onClick={() => router.push(`/e/event/cosmoprof-2025`)}
                  />

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 
                        className="font-bold text-lg leading-tight truncate pr-2 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => router.push(`/e/event/cosmoprof-2025`)}
                      >
                        {event.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleUnsaveEvent(event.id)}
                      >
                        <Bookmark className="h-4 w-4 fill-current text-red-600" />
                      </Button>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    {/* Saved Date */}
                    <p className="text-xs text-gray-500">
                      Saved {event.savedDate}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => router.push(`/e/event/cosmoprof-2025`)}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Share Event
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No events in this list
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Start saving events to see them here.
              </p>
              <Button
                onClick={() => router.push("/feed")}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Discover Events
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
