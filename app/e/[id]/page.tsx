"use client";

import EventDescription from "@/components/event-detail/event-description";
import EventGallery from "@/components/event-detail/event-gallery";
import EventGuestList from "@/components/event-detail/event-guest-list";
import EventHost from "@/components/event-detail/event-host";
import EventInfo from "@/components/event-detail/event-info";
import EventLocation from "@/components/event-detail/event-location";
import { EventSpotifyEmbed } from "@/components/event-detail/event-spotify-embed";
import { WavlakeEmbed } from "@/components/event-detail/event-wavlake-embed";
import SwipeableHeader from "@/components/event-detail/swipeable-header";
import { SilkLightbox, SilkLightboxRef } from "@/components/ui/silk-lightbox";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEventDetails } from "@/lib/hooks/useEventDetails";
import { useEventGallery } from "@/lib/hooks/useEventGallery";
import { useEventHosts } from "@/lib/hooks/useEventHosts";
import { useEventWeather } from "@/lib/hooks/useEventWeather";
import { debugLog } from "@/lib/utils/debug";
import { transformApiEventToDisplay } from "@/lib/utils/event-transform";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

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

  // Transform API data to display format
  const event = useMemo(() => {
    return eventData
      ? transformApiEventToDisplay(eventData, hostsData, galleryData)
      : null;
  }, [eventData, hostsData, galleryData]);

  // Fetch weather data for the event
  const { weather, loading: weatherLoading } = useEventWeather({
    location: {
      city: event?.location.city || "",
      country: event?.location.country || "",
      coordinates: event?.location.coordinates,
    },
    eventDate: event?.computedStartDate || "",
    enabled: !!event?.location.city && !!event?.location.country && !!event?.computedStartDate,
  });

  const isLoading = eventLoading || hostsLoading || galleryLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-red-500" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Event Not Found
          </h1>
          <p className="mb-4 text-gray-600">
            The event you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="mx-auto max-w-full bg-white md:max-w-sm">
        <SwipeableHeader
          event={event}
          onImageClick={(index) => {
            setLightboxImages(event.coverImages);
            lightboxRef.current?.open(index);
          }}
        />
        <div className="px-4 pb-20">
          <EventInfo event={event} currentUserId={user?.id || ""} />
          <EventHost event={event} />
          <EventGuestList event={event} currentUserId={user?.id || ""} />
          <EventLocation event={event} weather={weather} />
          <EventGallery
            event={event}
            currentUserId={user?.id || ""}
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
            isOwner={!!(user?.id && event.owner?.id && user.id === event.owner.id)}
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
