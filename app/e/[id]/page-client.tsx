'use client';

import EventComments from '@/components/event-detail/event-comments';
import EventDescription from '@/components/event-detail/event-description';
import EventGallery from '@/components/event-detail/event-gallery';
import EventGuestsSection from '@/components/event-detail/event-guests-section';
import EventHost from '@/components/event-detail/event-host';
import EventInfo from '@/components/event-detail/event-info';
import EventLocation from '@/components/event-detail/event-location';
import { EventSpotifyEmbed } from '@/components/event-detail/event-spotify-embed';
import EventSubEvents from '@/components/event-detail/event-sub-events';
import { WavlakeEmbed } from '@/components/event-detail/event-wavlake-embed';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { SilkLightbox, SilkLightboxRef } from '@/components/ui/silk-lightbox';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventHosts } from '@/lib/hooks/use-event-hosts';
import { useEventWeather } from '@/lib/hooks/use-event-weather';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useTopBar } from '@/lib/stores/topbar-store';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { Loader2, Share } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function EventDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const { user } = useAuth();
  const { setTopBarForRoute, clearRoute } = useTopBar();
  const lightboxRef = useRef<SilkLightboxRef>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  // Handle tab changes and update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Create new URL with updated tab parameter
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'details') {
      // Remove tab param for the default tab to keep URL clean
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }

    // Update URL without causing navigation/reload
    const newUrl = `${pathname}?${newParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  // Sync tab with URL when searchParams change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['details', 'comments', 'gallery'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('details');
    }
  }, [searchParams]);

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
  const {
    data: subEvents = [],
    isLoading: subEventsLoading,
    error: subEventsError,
  } = useSubEvents(eventId);

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
      <EventGuestsSection
        eventId={eventId}
        eventCreatorUserId={eventData?.creator_user_id || ''}
        hosts={hostsData}
        currentUserId={user?.id || ''}
      />
      <EventDescription event={event} />
      {(subEventsLoading || subEvents.length > 0 || subEventsError) && (
        <EventSubEvents
          subEvents={subEvents}
          subEventsLoading={subEventsLoading}
          subEventsError={subEventsError}
        />
      )}
      <EventLocation event={event} weather={weather} />

      {/* Music Section - Show embeds if Spotify or Wavlake URLs exist */}
      {(eventData?.spotify_url || eventData?.wavlake_url) && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Music</h3>
          {eventData.spotify_url && <EventSpotifyEmbed link={eventData.spotify_url} />}
          {eventData.wavlake_url && <WavlakeEmbed link={eventData.wavlake_url} />}
        </div>
      )}
    </div>
  );

  const renderCommentsTab = () => <EventComments eventId={event.id} />;

  const renderGalleryTab = () => {
    return (
      <EventGallery
        event={event}
        onImageClick={(index) => {
          setLightboxImages(event.galleryImages || []);
          lightboxRef.current?.open(index);
        }}
      />
    );
  };

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
        <div className='pb-20'>
          <div className='px-4'>
            <EventInfo event={event} currentUserId={user?.id || ''} />
          </div>

          {/* Tabbed Section */}
          <div className='mb-4 w-full bg-white'>
            {/* Tab Headers */}
            <div className='mb-2 flex flex-row items-center justify-center gap-2 px-4 py-3'>
              <button
                onClick={() => handleTabChange('details')}
                className={`rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                  activeTab === 'details'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => handleTabChange('comments')}
                className={`rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                  activeTab === 'comments'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => handleTabChange('gallery')}
                className={`rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Gallery
              </button>
            </div>

            {/* Tab Content */}
            <div className='px-4'>
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
