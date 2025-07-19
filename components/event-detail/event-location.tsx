'use client';

import { Env } from '@/lib/constants/env';
import { Event } from '@/lib/types/event';
import { ExternalLink, MapPin, Sun } from 'lucide-react';
import { useState } from 'react';

interface EventLocationProps {
  event: Event;
}

export default function EventLocation({ event }: EventLocationProps) {
  const [showMapOptions, setShowMapOptions] = useState(false);

  const fullAddress = `${event.location.address}, ${event.location.city}, ${
    event.location.state || ''
  } ${event.location.zipCode || ''}`.trim();
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${
    Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }&q=${encodeURIComponent(fullAddress)}&zoom=15&maptype=roadmap`;

  const handleOpenMaps = (provider: 'apple' | 'google') => {
    const address = encodeURIComponent(fullAddress);

    if (provider === 'apple') {
      window.open(`http://maps.apple.com/?q=${address}`, '_blank');
    } else {
      window.open(`https://maps.google.com/?q=${address}`, '_blank');
    }

    setShowMapOptions(false);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setShowMapOptions(false);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <>
      <div className="py-6 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

        {/* Location Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {event.location.name}
            </h3>
            <p className="text-gray-600 text-sm">
              {event.location.city}, {event.location.country}
            </p>
          </div>

          {/* Weather */}
          {event.weather && (
            <div className="flex items-center gap-2 text-gray-600">
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">
                {event.weather.temperature}°{event.weather.unit}
              </span>
            </div>
          )}
        </div>

        {/* Google Maps Embed */}
        <div className="relative h-48 rounded-xl overflow-hidden border border-gray-200">
          <iframe
            width="100%"
            height="100%"
            className="border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title={`Map of ${event.location.name}`}
            aria-label={`Map showing ${event.location.name}`}
            style={{ pointerEvents: 'auto' }}
          ></iframe>

          {/* Map Pin */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-red-500 rounded-full p-2 transform -translate-y-1/2">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Address overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4 pt-8">
            <p className="text-sm font-medium">{event.location.name}</p>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setShowMapOptions(true)}
            className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1.5 hover:bg-opacity-100 transition-all"
            aria-label="View larger map"
          >
            <ExternalLink className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Full Address - Clickable */}
        <button
          className="text-sm text-gray-600 mt-3 hover:text-red-600 transition-colors text-left"
          onClick={() => setShowMapOptions(true)}
        >
          {fullAddress}
        </button>
      </div>

      {/* Map Options Modal */}
      {showMapOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Open in Maps
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleOpenMaps('apple')}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Open in Apple Maps
              </button>

              <button
                onClick={() => handleOpenMaps('google')}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Open in Google Maps
              </button>

              <button
                onClick={handleCopyAddress}
                className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy Address
              </button>
            </div>

            <button
              onClick={() => setShowMapOptions(false)}
              className="w-full mt-4 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
