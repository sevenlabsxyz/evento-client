"use client";

import { Event } from "@/lib/types/event";
import { ExternalLink, MapPin, Sun } from "lucide-react";
import { useState } from "react";

interface EventLocationProps {
  event: Event;
}

export default function EventLocation({ event }: EventLocationProps) {
  const [showMapOptions, setShowMapOptions] = useState(false);

  const fullAddress =
    `${event.location.address}, ${event.location.city}, ${event.location.state || ""} ${event.location.zipCode || ""}`.trim();

  const handleOpenMaps = (provider: "apple" | "google") => {
    const address = encodeURIComponent(fullAddress);

    if (provider === "apple") {
      window.open(`http://maps.apple.com/?q=${address}`, "_blank");
    } else {
      window.open(`https://maps.google.com/?q=${address}`, "_blank");
    }

    setShowMapOptions(false);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setShowMapOptions(false);
      // Could show a toast notification here
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  return (
    <>
      <div className="border-t border-gray-100 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Location</h2>

        {/* Location Info */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-gray-900">
              {event.location.name}
            </h3>
            <p className="text-sm text-gray-600">
              {event.location.city}, {event.location.country}
            </p>
          </div>

          {/* Weather */}
          {event.weather && (
            <div className="flex items-center gap-2 text-gray-600">
              <Sun className="h-5 w-5" />
              <span className="text-sm font-medium">
                {event.weather.temperature}°{event.weather.unit}
              </span>
            </div>
          )}
        </div>

        {/* Map Placeholder */}
        <div
          className="relative h-32 cursor-pointer overflow-hidden rounded-xl bg-gray-200 transition-colors hover:bg-gray-300"
          onClick={() => setShowMapOptions(true)}
        >
          {/* Map Pin */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-red-500 p-2">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Address overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-3 text-white">
            <p className="text-sm font-medium">{event.location.name}</p>
          </div>

          {/* Expand hint */}
          <div className="absolute right-2 top-2 rounded-full bg-white bg-opacity-90 p-1">
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        {/* Full Address - Clickable */}
        <button
          className="mt-3 text-left text-sm text-gray-600 transition-colors hover:text-red-600"
          onClick={() => setShowMapOptions(true)}
        >
          {fullAddress}
        </button>
      </div>

      {/* Map Options Modal */}
      {showMapOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-center text-lg font-semibold">
              Open in Maps
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleOpenMaps("apple")}
                className="w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50"
              >
                Open in Apple Maps
              </button>

              <button
                onClick={() => handleOpenMaps("google")}
                className="w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50"
              >
                Open in Google Maps
              </button>

              <button
                onClick={handleCopyAddress}
                className="w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50"
              >
                Copy Address
              </button>
            </div>

            <button
              onClick={() => setShowMapOptions(false)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
