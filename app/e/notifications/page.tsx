"use client";

import { Navbar } from "@/components/navbar";
import { useTopBar } from "@/lib/stores/topbar-store";
import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function NotificationsPage() {
  const { setTopBar } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: "Notifications",
      subtitle: "Stay updated",
    });

    return () => {
      setTopBar({ rightContent: null });
    };
  }, [setTopBar]);

  const [activeTab, setActiveTab] = useState("notifications");

  const notifications = [
    {
      id: 1,
      type: "like",
      user: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "liked your Tokyo trip photo",
      time: "2m",
      isNew: true,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      type: "comment",
      user: {
        name: "Marcus Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: 'commented: "Amazing view! How long did you stay there?"',
      time: "15m",
      isNew: true,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      type: "follow",
      user: {
        name: "Emma Rodriguez",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "started following you",
      time: "1h",
      isNew: true,
    },
    {
      id: 4,
      type: "event",
      content: "Your flight to Tokyo departs in 2 hours",
      time: "2h",
      isNew: false,
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
    },
    {
      id: 5,
      type: "like",
      user: {
        name: "Alex Kim",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "and 12 others liked your Shibuya Crossing video",
      time: "3h",
      isNew: false,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 6,
      type: "location",
      content: "Check-in reminder: AC Tokyo Hotel Ginza at 3:30 PM",
      time: "4h",
      isNew: false,
      icon: <MapPin className="h-6 w-6 text-green-600" />,
    },
    {
      id: 7,
      type: "comment",
      user: {
        name: "Lisa Park",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: "replied to your comment on Tokyo food recommendations",
      time: "1d",
      isNew: false,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-6 w-6 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-6 w-6 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-6 w-6 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
      {/* Header */}

      {/* Notifications Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Today</h3>
        </div>

        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
              notification.isNew ? "bg-blue-50" : ""
            }`}
          >
            {/* Avatar or Icon */}
            <div className="flex-shrink-0">
              {notification.user ? (
                <div className="relative">
                  <img
                    src={notification.user.avatar || "/placeholder.svg"}
                    alt={notification.user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {notification.type !== "follow" && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  {notification.icon}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-base">
                    {notification.user && (
                      <span className="font-semibold">
                        {notification.user.name}{" "}
                      </span>
                    )}
                    <span className={notification.isNew ? "font-medium" : ""}>
                      {notification.content}
                    </span>
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                </div>

                {/* Thumbnail */}
                {notification.image && (
                  <img
                    src={notification.image || "/placeholder.svg"}
                    alt="Notification"
                    className="ml-3 h-12 w-12 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>

            {/* New indicator */}
            {notification.isNew && (
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
            )}
          </div>
        ))}

        {/* Earlier section */}
        <div className="mt-6 px-4 py-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Earlier</h3>
        </div>

        <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-base">
              <span className="font-semibold">Travel Community </span>
              Your Tokyo itinerary received 50+ likes this week!
            </p>
            <div className="mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <p className="text-xs text-gray-500">3d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
