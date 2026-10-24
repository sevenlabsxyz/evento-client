'use client';

import { Env } from '@/lib/constants/env';
import { EventDetail } from '@/lib/types/event';
import { WeatherData } from '@/lib/types/weather';
import { formatEventLocationAddress } from '@/lib/utils/location';
import { ExternalLink, MapPin, Sun } from 'lucide-react';
import { useState } from 'react';
import { EventSection } from './event-section';
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
      <EventSection
        title='Location'
        action={
          weather ? (
            <button
              onClick={() => setShowWeatherDetail(true)}
              className='inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-700 transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              type='button'
            >
              <Sun className='h-4 w-4 text-amber-500' />
              <span className='text-sm font-medium'>
                {weather.temperature}°{weather.unit}
              </span>
            </button>
          ) : undefined
        }
      >
        {/* Location Info */}
        <button
          type='button'
          className='flex w-full items-start gap-3 text-left'
          onClick={() => !isTBDLocation && setShowMapOptions(true)}
        >
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-neutral-800'>
            <MapPin className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
          </span>
          <span className='min-w-0 flex-1'>
            <span
              className={`block truncate text-sm font-semibold ${isTBDLocation ? 'text-gray-500 dark:text-neutral-500' : 'text-gray-900 dark:text-neutral-100'}`}
            >
              {event.location.name}
            </span>
            {!isTBDLocation && (event.location.city || event.location.country) && (
              <span className='block truncate text-sm text-gray-500 dark:text-neutral-500'>
                {event.location.city}
                {event.location.city && event.location.country && `, ${event.location.country}`}
              </span>
            )}
          </span>
        </button>

        {/* Google Maps Embed - Only show if not TBD */}
        {!isTBDLocation && (
          <div className='relative mt-4 h-48 overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800'>
            <iframe
              width='100%'
              height='100%'
              className='border-0 dark:hue-rotate-180 dark:invert-[0.9]'
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
              <div className='-translate-y-1/2 transform rounded-full bg-red-500 p-2 dark:bg-red-600'>
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
              className='absolute right-2 top-2 z-20 rounded-full bg-white bg-opacity-90 p-1.5 transition-all hover:bg-opacity-100 dark:bg-neutral-900 dark:ring-1 dark:ring-neutral-700'
              type='button'
            >
              <ExternalLink className='h-4 w-4 text-gray-700 dark:text-neutral-300' />
            </button>
          </div>
        )}
      </EventSection>

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
