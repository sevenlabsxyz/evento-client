"use client";

import { Event } from "@/lib/types/event";
import { useRouter } from "next/navigation";

interface EventGuestListProps {
  event: Event;
  currentUserId?: string;
}

export default function EventGuestList({
  event,
  currentUserId,
}: EventGuestListProps) {
  const router = useRouter();
  const guests = event.guests || [];
  const isOwner = event.owner?.id === currentUserId;

  // Filter to only show guests who are going
  const goingGuests = guests.filter((guest) => guest.status === "going");
  const goingCount = goingGuests.length;

  // Show up to 4 avatars, then +X for the rest
  const displayAvatars = goingGuests.slice(0, 4);
  const remainingCount = Math.max(0, goingCount - 4);

  // Don't render if no guests are going
  if (goingCount === 0) {
    return null;
  }

  const handleClick = () => {
    if (isOwner) {
      // Owner can see full guest management page
      router.push(`/e/event/${event.id}/manage/guests`);
    } else {
      // Non-owners see public guest list (going only)
      router.push(`/e/event/${event.id}/guests`);
    }
  };

  return (
    <div className="border-b border-gray-100 py-6">
      <button
        onClick={handleClick}
        className="-m-4 w-full rounded-lg p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Overlapping Avatars */}
            <div className="flex items-center">
              {displayAvatars.map((guest, index) => (
                <div
                  key={guest.id}
                  className="relative"
                  style={{
                    marginLeft: index > 0 ? "-12px" : "0",
                    zIndex: displayAvatars.length - index,
                  }}
                >
                  <img
                    src={guest.avatar}
                    alt={guest.name}
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                  />
                </div>
              ))}

              {/* +X indicator for remaining guests */}
              {remainingCount > 0 && (
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200"
                  style={{
                    marginLeft: "-12px",
                    zIndex: 0,
                  }}
                >
                  <span className="text-xs font-semibold text-gray-600">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>

            {/* Guest Count Text */}
            <div>
              <p className="font-medium text-gray-900">
                {goingCount} {goingCount === 1 ? "person" : "people"} going
              </p>
              <p className="text-sm text-gray-500">Tap to see guest list</p>
            </div>
          </div>

          {/* Chevron indicator */}
          <div className="text-gray-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
