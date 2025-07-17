"use client";

import { Check, Clock, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    date: Date;
    time: { hour: number; minute: number; period: "AM" | "PM" };
  };
}

export default function EventCreatedModal({
  isOpen,
  onClose,
  eventData,
}: EventCreatedModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (time: {
    hour: number;
    minute: number;
    period: "AM" | "PM";
  }) => {
    return `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")} ${time.period}`;
  };

  const handleViewEvent = () => {
    onClose();
    router.push(`/e/${eventData.id}`);
  };

  const handleInviteGuests = () => {
    onClose();
    router.push(`/e/${eventData.id}/invite`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close Button */}
      <div className="absolute right-4 top-4">
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <X className="h-6 w-6 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Success Icon */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
          <Check className="h-10 w-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-2xl font-medium text-gray-400">
          Event Created!
        </h1>

        {/* Event Name */}
        <h2 className="mb-8 text-4xl font-bold text-gray-900">
          {eventData.title}
        </h2>

        {/* Date and Time */}
        <div className="mb-16 flex items-center gap-2 text-gray-500">
          <Clock className="h-5 w-5" />
          <span className="text-lg">
            {formatDate(eventData.date)} at {formatTime(eventData.time)} PDT
          </span>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleViewEvent}
            className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
          >
            View Event Page
          </button>

          <button
            onClick={handleInviteGuests}
            className="w-full py-4 text-lg font-medium text-gray-500"
          >
            Invite Guests
          </button>
        </div>
      </div>
    </div>
  );
}
