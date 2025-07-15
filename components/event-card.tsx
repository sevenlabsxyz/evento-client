"use client";

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Calendar,
  Clock,
  Flag,
  UserMinus,
  Share,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReusableDropdown } from "@/components/reusable-dropdown";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EventWithUser } from "@/lib/types/api";
import { formatEventDate, getRelativeTime } from "@/lib/utils/date";
import { getOptimizedCoverUrl, getOptimizedAvatarUrl } from "@/lib/utils/image";

interface EventCardProps {
  event: EventWithUser;
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
}

export function EventCard({
  event,
  onBookmark,
  isBookmarked = false,
}: EventCardProps) {
  const router = useRouter();
  const { date, timeWithTz } = formatEventDate(
    event.computed_start_date,
    event.timezone
  );
  const timeAgo = getRelativeTime(event.created_at);

  const getDropdownItems = (eventId: string, userName: string) => [
    {
      label: "Share Event",
      icon: <Share className="w-4 h-4" />,
      action: () => {
        toast.success("Event shared!");
      },
    },
    {
      label: "Copy Link",
      icon: <Copy className="w-4 h-4" />,
      action: () => {
        navigator.clipboard.writeText(`${window.location.origin}/e/${eventId}`);
        toast.success("Link copied to clipboard!");
      },
    },
    {
      label: `Unfollow ${userName}`,
      icon: <UserMinus className="w-4 h-4" />,
      action: () => {
        toast.success(`Unfollowed ${userName}`);
      },
    },
    {
      label: "Report Post",
      icon: <Flag className="w-4 h-4" />,
      action: () => {
        toast.success("Post reported. Thank you for your feedback.");
      },
      destructive: true,
    },
  ];

  const handleEventClick = () => {
    router.push(`/e/${event.id}`);
  };

  return (
    <div className="mb-6 bg-white">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={getOptimizedAvatarUrl(event.user_details.image || "")}
            alt={event.user_details.name || event.user_details.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">
              {event.user_details.name || event.user_details.username}
            </p>
            <p className="text-xs text-gray-500">
              Posted by @{event.user_details.username} {timeAgo}
            </p>
          </div>
        </div>
        <ReusableDropdown
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gray-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
          items={getDropdownItems(
            event.id,
            event.user_details.name || event.user_details.username
          )}
          align="right"
          width="w-56"
        />
      </div>

      {/* Event Image - Square aspect ratio */}
      <div className="relative">
        <img
          src={getOptimizedCoverUrl(event.cover || "", "feed")}
          alt={event.title}
          className="w-full aspect-square object-cover cursor-pointer"
          onClick={handleEventClick}
        />
      </div>

      {/* Event Details */}
      <div className="px-4 py-3">
        <h3
          className="font-semibold text-lg mb-2 cursor-pointer hover:text-red-600 transition-colors"
          onClick={handleEventClick}
        >
          {event.title}
        </h3>

        {/* Date, Time, Location */}
        <div className="flex items-center gap-4 text-base text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          {timeWithTz && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{timeWithTz}</span>
            </div>
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Event Description (if exists) */}
        {event.description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Post Actions - All on left side */}
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 rounded-full bg-gray-100"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 rounded-full bg-gray-100"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 rounded-full bg-gray-100"
          >
            <Send className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 rounded-full bg-gray-100"
            onClick={() => onBookmark?.(event.id)}
          >
            <Bookmark
              className={`h-5 w-5 ${
                isBookmarked ? "fill-current text-red-600" : ""
              }`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
