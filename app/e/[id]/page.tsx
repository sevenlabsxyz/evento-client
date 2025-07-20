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
import { useEventWeather } from '@/lib/hooks/useEventWeather';
import { useTopBar } from '@/lib/stores/topbar-store';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { Loader2, MessageCircle, Share } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const { user } = useAuth();
  const { setTopBarForRoute, clearRoute } = useTopBar();
  const lightboxRef = useRef<SilkLightboxRef>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  // Configure TopBar for event pages
  useEffect(() => {
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    setTopBarForRoute(pathname, {
      leftMode: 'back',
      centerMode: 'empty',
      showAvatar: false,
      buttons: [
        {
          id: 'share',
          icon: Share,
          onClick: handleShare,
          label: 'Share',
        },
      ],
      isOverlaid: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, clearRoute]);

  // Fetch event data from API
  const { data: eventData, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
  const { data: hostsData = [], isLoading: hostsLoading } = useEventHosts(eventId);
  const { data: galleryData = [], isLoading: galleryLoading } = useEventGallery(eventId);

  // Transform API data to display format
  const event = useMemo(() => {
    return eventData ? transformApiEventToDisplay(eventData, hostsData, galleryData) : null;
  }, [eventData, hostsData, galleryData]);

  // Fetch weather data for the event
  const { weather, loading: weatherLoading } = useEventWeather({
    location: {
      city: event?.location.city || '',
      country: event?.location.country || '',
      coordinates: event?.location.coordinates,
    },
    eventDate: event?.computedStartDate || '',
    enabled: !!event?.location.city && !!event?.location.country && !!event?.computedStartDate,
  });

  const isLoading = eventLoading || hostsLoading || galleryLoading;

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-red-500' />
          <p className='text-gray-600'>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderDetailsTab = () => (
    <div className='space-y-6'>
      <EventHost event={event} />
      <EventGuestList event={event} currentUserId={user?.id || ''} />
      <EventLocation event={event} weather={weather} />
      
      {/* Music Section - Show embeds if Spotify or Wavlake URLs exist */}
      {(eventData?.spotify_url || eventData?.wavlake_url) && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Music</h3>
          {eventData.spotify_url && <EventSpotifyEmbed link={eventData.spotify_url} />}
          {eventData.wavlake_url && <WavlakeEmbed link={eventData.wavlake_url} />}
        </div>
      )}

      <EventDescription
        event={event}
        isOwner={!!(user?.id && event.owner?.id && user.id === event.owner.id)}
      />
    </div>
  );

  const renderCommentsTab = () => (
    <div className='flex flex-col items-center justify-center py-12'>
      <MessageCircle className='mb-4 h-12 w-12 text-gray-300' />
      <h3 className='mb-2 text-lg font-medium text-gray-900'>No Comments Yet</h3>
      <p className='text-center text-sm text-gray-500'>
        Be the first to leave a comment about this event.
      </p>
    </div>
  );

  const renderGalleryTab = () => (
    <EventGallery
      event={event}
      currentUserId={user?.id || ''}
      onImageClick={(index) => {
        setLightboxImages(event.galleryImages || []);
        lightboxRef.current?.open(index);
      }}
    />
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Main content */}
      <div className='mx-auto max-w-full bg-white md:max-w-sm'>
        <SwipeableHeader
          event={event}
          onImageClick={(index) => {
            setLightboxImages(event.coverImages);
            lightboxRef.current?.open(index);
          }}
        />
        <div className='px-4 pb-20'>
          <EventInfo event={event} currentUserId={user?.id || ''} />
          
          {/* Tabbed Section */}
          <div className='mb-4 bg-white'>
            {/* Tab Headers */}
            <div className='flex gap-2 py-3'>
              <button
                onClick={() => setActiveTab('details')}
                className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                  activeTab === 'details'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                  activeTab === 'comments'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                Gallery
              </button>
            </div>

            {/* Tab Content */}
            <div className='pt-4'>
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'comments' && renderCommentsTab()}
              {activeTab === 'gallery' && renderGalleryTab()}
            </div>
          </div>
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
