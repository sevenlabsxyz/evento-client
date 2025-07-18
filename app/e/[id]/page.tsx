'use client';

import EventDescription from '@/components/event-detail/event-description';
import EventGallery from '@/components/event-detail/event-gallery';
import EventGuestList from '@/components/event-detail/event-guest-list';
import EventHost from '@/components/event-detail/event-host';
import EventInfo from '@/components/event-detail/event-info';
import EventLocation from '@/components/event-detail/event-location';
import { EventSpotifyEmbed } from '@/components/event-detail/event-spotify-embed';
import { WavlakeEmbed } from '@/components/event-detail/event-wavlake-embed';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { SilkLightbox, SilkLightboxRef } from '@/components/ui/silk-lightbox';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { useEventGallery } from '@/lib/hooks/useEventGallery';
import { useEventHosts } from '@/lib/hooks/useEventHosts';
import { debugLog } from '@/lib/utils/debug';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { ArrowLeft, Loader2, MoreHorizontal, Share } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuth();
  const lightboxRef = useRef<SilkLightboxRef>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  // Fetch event data from API
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError,
  } = useEventDetails(eventId);
  const { data: hostsData = [], isLoading: hostsLoading } =
    useEventHosts(eventId);
  const { data: galleryData = [], isLoading: galleryLoading } =
    useEventGallery(eventId);

  // Debug logging
  debugLog('EventDetailPage', 'Component render', {
    eventId,
    hasEventData: !!eventData,
    eventLoading,
    hasEventError: !!eventError,
    hostsDataLength: hostsData.length,
    galleryDataLength: galleryData.length,
  });

  if (eventData) {
    debugLog('EventDetailPage', 'Event data structure', {
      keys: Object.keys(eventData),
      title: eventData.title,
      has_start_date_day: 'start_date_day' in eventData,
      has_date: 'date' in eventData,
      has_time: 'time' in eventData,
    });
  }

  // Transform API data to display format
  const event = eventData
    ? transformApiEventToDisplay(eventData, hostsData, galleryData)
    : null;

  const isLoading = eventLoading || hostsLoading || galleryLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The event you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.back();
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
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Share className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:max-w-sm max-w-full mx-auto bg-white">
        <SwipeableHeader
          event={event}
          onImageClick={(index) => {
            setLightboxImages(event.coverImages);
            lightboxRef.current?.open(index);
          }}
        />
        <div className="px-4 pb-20">
          <EventInfo event={event} currentUserId={user?.id || ''} />
          <EventHost event={event} />
          <EventGuestList event={event} currentUserId={user?.id || ''} />
          <EventLocation event={event} />
          <EventGallery
            event={event}
            currentUserId={user?.id || ''}
            onImageClick={(index) => {
              setLightboxImages(event.galleryImages || []);
              lightboxRef.current?.open(index);
            }}
          />

          {/* Music Section - Show embeds if Spotify or Wavlake URLs exist */}
          {(eventData?.spotify_url || eventData?.wavlake_url) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Music</h3>
              {eventData.spotify_url && (
                <EventSpotifyEmbed link={eventData.spotify_url} />
              )}
              {eventData.wavlake_url && (
                <WavlakeEmbed link={eventData.wavlake_url} />
              )}
            </div>
          )}

          <EventDescription
            event={event}
            isOwner={user?.id === event.owner?.id}
          />
        </div>
      </div>

      {/* Image Lightbox */}
      <SilkLightbox
        ref={lightboxRef}
        images={lightboxImages.length > 0 ? lightboxImages : event.coverImages}
        eventTitle={event.title}
      />
    </div>
  );
}
