"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Navbar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const conversations = [
    {
      id: 1,
      type: "user",
      user: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=50&width=50",
      },
      lastMessage: "The ramen place you recommended was amazing! 🍜",
      time: "2m",
      isOnline: true,
      unreadCount: 2,
      isNew: true,
    },
    {
      id: 2,
      type: "group",
      user: {
        name: "Tokyo Adventure",
        avatar: "/placeholder.svg?height=50&width=50",
      },
      lastMessage: "Marcus: Anyone up for Shibuya tonight?",
      time: "15m",
      isOnline: false,
      unreadCount: 5,
      isGroup: true,
    },
    {
      id: 3,
      type: "user",
      user: {
        name: "Emma Rodriguez",
        avatar: "/placeholder.svg?height=50&width=50",
      },
      lastMessage: "Thanks for the Bali tips! Having an amazing time here",
      time: "1h",
      isOnline: true,
      unreadCount: 0,
    },
    {
      id: 4,
      type: "group",
      user: {
        name: "Paris Food Tour",
        avatar: "/placeholder.svg?height=50&width=50",
      },
      lastMessage: "Lisa: The croissants here are incredible!",
      time: "2h",
      isOnline: false,
      unreadCount: 1,
      isGroup: true,
    },
    {
      id: 5,
      type: "user",
      user: {
        name: "Marcus Johnson",
        avatar: "/placeholder.svg?height=50&width=50",
      },
      lastMessage: "You: See you at the Eiffel Tower at 7!",
      time: "3h",
      isOnline: false,
      unreadCount: 0,
    },
  ];

  const handleConversationClick = (conversationId: number) => {
    router.push(`/messages/${conversationId}`);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-40 border-b border-gray-100">
        <PageHeader
          title="Chat"
          subtitle="Connect with mutuals and event groups"
          rightContent={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100"
              onClick={() => router.push("/messages/search")}
            >
              <Plus className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {/* Search Bar */}
      <div className="fixed top-[120px] left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full bg-white z-30 px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Messages Content */}
      <div className="flex-1 overflow-y-auto pt-[170px] pb-20">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => handleConversationClick(conversation.id)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 cursor-pointer"
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <img
                src={conversation.user.avatar || "/placeholder.svg"}
                alt={conversation.user.name}
                className={`object-cover ${
                  conversation.type === "group"
                    ? "w-12 h-12 rounded-xl"
                    : "w-12 h-12 rounded-full"
                }`}
              />
              {conversation.type === "user" && conversation.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Message content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">
                  {conversation.user.name}
                  {conversation.isGroup && (
                    <span className="ml-1 text-xs text-gray-500">• Group</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {conversation.time}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
              <p
                className={`text-sm truncate ${
                  conversation.unreadCount > 0
                    ? "font-medium text-gray-900"
                    : "text-gray-600"
                }`}
              >
                {conversation.lastMessage}
              </p>
            </div>
          </div>
        ))}

        {/* No results message */}
        {searchQuery && filteredConversations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No conversations found</p>
          </div>
        )}
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
