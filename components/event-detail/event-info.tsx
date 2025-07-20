"use client";

import { Event } from "@/lib/types/event";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  MoreHorizontal,
  Share,
  Star,
} from "lucide-react";
import { useState } from "react";
import ContactHostSheet from "./contact-host-sheet";
import MoreOptionsSheet from "./more-options-sheet";
import OwnerEventButtons from "./owner-event-buttons";

interface EventInfoProps {
  event: Event;
  currentUserId?: string;
}

export default function EventInfo({
  event,
  currentUserId = "current-user-id",
}: EventInfoProps) {
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const handleRegister = () => {
    if (event.registrationUrl) {
      window.open(event.registrationUrl, "_blank");
    }
  };

  const handleContact = () => {
    setShowContactSheet(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    // In a real app, this would send the message to the host via API
  };

  const handleAddToCalendar = () => {
    // Generate .ics file content
    const formatICSDate = (dateStr: string) => {
      // Convert ISO date to ICS format: YYYYMMDDTHHMMSSZ
      const date = new Date(dateStr);
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    const escapeICS = (text: string) => {
      return text
        .replace(/[\n\r]/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    };

    const location =
      `${event.location.name}, ${event.location.address || ""}, ${event.location.city}, ${event.location.state || ""} ${event.location.zipCode || ""}`
        .replace(/,\s*,/g, ",")
        .trim();

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Evento//Event Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@evento.so`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(event.computedStartDate)}`,
      `DTEND:${formatICSDate(event.computedEndDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description.replace(/<[^>]*>/g, ""))}`,
      `LOCATION:${escapeICS(location)}`,
      event.registrationUrl ? `URL:${event.registrationUrl}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    // Create and download .ics file
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInSafari = () => {
    if (event.registrationUrl) {
      window.open(event.registrationUrl, "_blank");
    }
  };

  // Check if current user is the event owner
  const isOwner = event.owner?.id === currentUserId;

  return (
    <>
      <div className="space-y-6 py-6">
        {/* Date and Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-black">
            <span className="font-bold text-2xl">{event.title}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-medium">{event.date}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="h-5 w-5 text-gray-400" />
            <span>
              {event.startTime} - {event.endTime}
              {event.timezone && ` ${event.timezone}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span>{event.location.name}</span>
          </div>
        </div>

        {/* Action Buttons - Different for owners vs guests */}
        {isOwner ? (
          <OwnerEventButtons eventId={event.id} />
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleRegister}
              className="flex h-16 flex-col items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <Star className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Register</span>
            </button>

            <button
              onClick={handleContact}
              className="flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Mail className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Contact</span>
            </button>

            <button
              onClick={handleShare}
              className="flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Share className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Share</span>
            </button>

            <button
              onClick={() => setShowMoreSheet(true)}
              className="flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <MoreHorizontal className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </div>
        )}
      </div>

      {/* Contact Host Sheet */}
      <ContactHostSheet
        isOpen={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        onSendMessage={handleSendMessage}
      />

      {/* More Options Sheet */}
      <MoreOptionsSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        onAddToCalendar={handleAddToCalendar}
        onOpenInSafari={handleOpenInSafari}
      />
    </>
  );
}
