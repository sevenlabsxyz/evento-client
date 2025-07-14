"use client";

import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const suggestedUsers = [
    {
      id: 6,
      name: "David Wilson",
      username: "@davidw",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "London, UK",
      mutualEvents: 3,
      isOnline: true,
    },
    {
      id: 7,
      name: "Lisa Park",
      username: "@lisap",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "Seoul, Korea",
      mutualEvents: 1,
      isOnline: false,
    },
    {
      id: 8,
      name: "Alex Kim",
      username: "@alexk",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "Vancouver, Canada",
      mutualEvents: 5,
      isOnline: true,
    },
    {
      id: 9,
      name: "Maria Garcia",
      username: "@mariag",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "Barcelona, Spain",
      mutualEvents: 2,
      isOnline: false,
    },
  ];

  const searchResults = [
    {
      id: 10,
      name: "John Smith",
      username: "@johns",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "New York, USA",
      mutualEvents: 1,
      isOnline: true,
    },
    {
      id: 11,
      name: "Anna Johnson",
      username: "@annaj",
      avatar: "/placeholder.svg?height=50&width=50",
      location: "Stockholm, Sweden",
      mutualEvents: 0,
      isOnline: false,
    },
  ];

  const handleUserClick = (userId: number) => {
    // Navigate to chat with this user
    router.push(`/messages/${userId}`);
  };

  const usersToShow = searchQuery ? searchResults : suggestedUsers;
  const sectionTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : "Suggested";

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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {sectionTitle}
          </h3>
          <div className="space-y-3">
            {usersToShow.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {user.name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="truncate">{user.location}</span>
                    {user.mutualEvents > 0 && (
                      <>
                        <span>•</span>
                        <span>{user.mutualEvents} mutual events</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent"
                >
                  Message
                </Button>
              </div>
            ))}
          </div>

          {searchQuery && usersToShow.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
