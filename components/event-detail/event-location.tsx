'use client';

import { Env } from '@/lib/constants/env';
import { ExternalLink, MapPin, Sun } from '@/lib/icons';
import { EventDetail } from '@/lib/types/event';
import { WeatherData } from '@/lib/types/weather';
import { formatEventLocationAddress } from '@/lib/utils/location';
import { useState } from 'react';
import { LocationActionsSheet } from './location-actions-sheet';
import WeatherDetailSheet from './weather-detail-sheet';

interface EventLocationProps {
  event: EventDetail;
  weather?: WeatherData | null;
}

export default function EventLocation({ event, weather }: EventLocationProps) {
  const [showMapOptions, setShowMapOptions] = useState(false);
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);

  const isTBDLocation = event.location.name === 'TBD';
  const fullAddress = formatEventLocationAddress(event.location);
  const destination = event.location.coordinates
    ? `${event.location.coordinates.lat},${event.location.coordinates.lng}`
    : fullAddress;
  const encodedDestination = encodeURIComponent(destination);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`;
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${
    Env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }&q=${encodeURIComponent(fullAddress)}&zoom=15&maptype=roadmap`;

  return (
    <>
      <div className='border-t border-gray-100 py-6'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>Location</h2>

        {/* Location Info */}
        <div className='mb-4 flex items-start justify-between'>
          <button
            type='button'
            className='flex-1 text-left'
            onClick={() => !isTBDLocation && setShowMapOptions(true)}
          >
            <h3
              className={`mb-1 font-semibold ${isTBDLocation ? 'text-gray-500' : 'text-gray-900'}`}
            >
              {event.location.name}
            </h3>
            {!isTBDLocation && (event.location.city || event.location.country) && (
              <p className={`text-sm text-gray-600`}>
                {event.location.city}
                {event.location.city && event.location.country && `, ${event.location.country}`}
              </p>
            )}
          </button>

          {/* Weather */}
          {weather && (
            <button
              onClick={() => setShowWeatherDetail(true)}
              className='flex cursor-pointer items-center gap-2 rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800'
              type='button'
            >
              <Sun className='h-5 w-5' />
              <span className='text-sm font-medium'>
                {weather.temperature}°{weather.unit}
              </span>
            </button>
          )}
        </div>

        {/* Google Maps Embed - Only show if not TBD */}
        {!isTBDLocation && (
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
              style={{ pointerEvents: 'none' }}
            ></iframe>

            <button
              onClick={() => window.open(googleMapsDirectionsUrl, '_blank', 'noopener,noreferrer')}
              className='absolute inset-0 z-10 cursor-pointer bg-transparent'
              aria-label={`Open directions to ${event.location.name} in Google Maps`}
              type='button'
            />

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
              className='absolute right-2 top-2 z-20 rounded-full bg-white bg-opacity-90 p-1.5 transition-all hover:bg-opacity-100'
              type='button'
            >
              <ExternalLink className='h-4 w-4 text-gray-700' />
            </button>
          </div>
        )}
      </div>

      {!isTBDLocation && (
        <LocationActionsSheet
          open={showMapOptions}
          onOpenChange={setShowMapOptions}
          fullAddress={fullAddress}
          destination={destination}
        />
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
