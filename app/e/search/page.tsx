"use client";

import { Search, Clock, MapPin, Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const recentSearches = [
    "Tokyo events",
    "Food festivals",
    "Marcus Johnson",
    "Paris photography",
    "Sunset experiences",
  ];

  const suggestedSearches = [
    { icon: <Calendar className="h-4 w-4" />, text: "Events this weekend" },
    { icon: <MapPin className="h-4 w-4" />, text: "Events near me" },
    { icon: <Users className="h-4 w-4" />, text: "Popular events" },
    { icon: <Clock className="h-4 w-4" />, text: "Upcoming events" },
  ];

  const searchResults = [
    {
      type: "event",
      title: "Tokyo Skytree Sunset Experience",
      location: "Tokyo, Japan",
      date: "Sep 15, 2025",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      type: "user",
      name: "Marcus Johnson",
      username: "@marcusj",
      location: "Paris, France",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      type: "event",
      title: "Eiffel Tower Night Photography",
      location: "Paris, France",
      date: "Sep 20, 2025",
      image: "/placeholder.svg?height=60&width=60",
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, this would trigger the search API
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, people, places..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            autoFocus
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-gray-100"
          onClick={() => router.back()}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          /* Search Results */
          <div className="px-4 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Results for "{searchQuery}"
            </h3>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <img
                    src={result.type === "user" ? result.avatar : result.image}
                    alt=""
                    className={`object-cover ${
                      result.type === "user"
                        ? "w-12 h-12 rounded-full"
                        : "w-12 h-12 rounded-lg"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {result.type === "user" ? result.name : result.title}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{result.location}</span>
                      {result.type === "event" && result.date && (
                        <>
                          <span>•</span>
                          <span>{result.date}</span>
                        </>
                      )}
                      {result.type === "user" && result.username && (
                        <>
                          <span>•</span>
                          <span>{result.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Default State */
          <div className="px-4 py-4 space-y-6">
            {/* Recent Searches */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Recent
              </h3>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Searches */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Suggestions
              </h3>
              <div className="space-y-2">
                {suggestedSearches.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion.text)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="text-gray-400">{suggestion.icon}</div>
                    <span className="text-gray-700">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "#TokyoEvents",
                  "#FoodFestival",
                  "#Photography",
                  "#Sunset",
                  "#Travel",
                ].map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(tag)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
