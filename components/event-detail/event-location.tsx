'use client';

import { Env } from '@/lib/constants/env';
import { Event } from '@/lib/types/event';
import { WeatherData } from '@/lib/types/weather';
import { ExternalLink, MapPin, Sun } from 'lucide-react';
import { useState } from 'react';
import WeatherDetailSheet from './weather-detail-sheet';

interface EventLocationProps {
  event: Event;
  weather?: WeatherData | null;
}

export default function EventLocation({ event, weather }: EventLocationProps) {
  const [showMapOptions, setShowMapOptions] = useState(false);
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);

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
      <div className='border-t border-gray-100 py-6'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>Location</h2>

        {/* Location Info */}
        <div className='mb-4 flex items-start justify-between'>
          <div className='flex-1' onClick={() => setShowMapOptions(true)}>
            <h3 className='mb-1 font-semibold text-gray-900'>{event.location.name}</h3>
            <p className='text-sm text-gray-600'>
              {event.location.city}, {event.location.country}
            </p>
          </div>

          {/* Weather */}
          {weather && (
            <button
              onClick={() => setShowWeatherDetail(true)}
              className='flex cursor-pointer items-center gap-2 rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800'
            >
              <Sun className='h-5 w-5' />
              <span className='text-sm font-medium'>
                {weather.temperature}°{weather.unit}
              </span>
            </button>
          )}
        </div>

        {/* Google Maps Embed */}
        <div className='relative h-48 overflow-hidden rounded-xl border border-gray-200'>
          <iframe
            width='100%'
            height='100%'
            className='border-0'
            loading='lazy'
            allowFullScreen
            referrerPolicy='no-referrer-when-downgrade'
            src={mapUrl}
            title={`Map of ${event.location.name}`}
            aria-label={`Map showing ${event.location.name}`}
            style={{ pointerEvents: 'auto' }}
          ></iframe>

          {/* Map Pin */}
          <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform'>
            <div className='-translate-y-1/2 transform rounded-full bg-red-500 p-2'>
              <MapPin className='h-4 w-4 text-white' />
            </div>
          </div>

          {/* Address overlay */}
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 pt-8 text-white'>
            <p className='text-sm font-medium'>{fullAddress}</p>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setShowMapOptions(true)}
            className='absolute right-2 top-2 rounded-full bg-white bg-opacity-90 p-1.5 transition-all hover:bg-opacity-100'
          >
            <ExternalLink className='h-4 w-4 text-gray-700' />
          </button>
        </div>
      </div>

      {/* Map Options Modal */}
      {showMapOptions && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6'>
            <h3 className='mb-4 text-center text-lg font-semibold'>Open in Maps</h3>

            <div className='space-y-3'>
              <button
                onClick={() => handleOpenMaps('apple')}
                className='w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50'
              >
                Open in Apple Maps
              </button>

              <button
                onClick={() => handleOpenMaps('google')}
                className='w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50'
              >
                Open in Google Maps
              </button>

              <button
                onClick={handleCopyAddress}
                className='w-full rounded-lg border border-gray-300 p-3 text-left transition-colors hover:bg-gray-50'
              >
                Copy Address
              </button>
            </div>

            <button
              onClick={() => setShowMapOptions(false)}
              className='mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weather Detail Sheet */}
      {weather && (
        <WeatherDetailSheet
          weather={weather}
          locationName={`${event.location.city}, ${event.location.country}`}
          isOpen={showWeatherDetail}
          onClose={() => setShowWeatherDetail(false)}
        />
      )}
    </>
  );
}
