'use client';

import EventDescription from '@/components/event-detail/event-description';
import EventComments from '@/components/event-detail/event-comments';
import EventGallery from '@/components/event-detail/event-gallery';
import EventGuestList from '@/components/event-detail/event-guest-list';
import EventHost from '@/components/event-detail/event-host';
import EventInfo from '@/components/event-detail/event-info';
import EventLocation from '@/components/event-detail/event-location';
import { EventSpotifyEmbed } from '@/components/event-detail/event-spotify-embed';
import { WavlakeEmbed } from '@/components/event-detail/event-wavlake-embed';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { useEventGallery } from '@/lib/hooks/useEventGallery';
import { useEventHosts } from '@/lib/hooks/useEventHosts';
import { useEventWeather } from '@/lib/hooks/useEventWeather';
import { useTopBar } from '@/lib/stores/topbar-store';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { Loader2, MessageCircle, Share } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const { setTopBarForRoute, clearRoute } = useTopBar();
  const [selectedCoverImageIndex, setSelectedCoverImageIndex] = useState<number | null>(null);
  const [selectedGalleryImageIndex, setSelectedGalleryImageIndex] = useState<number | null>(null);
  
  // Initialize activeTab from URL query parameter or default to 'details'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'comments' || tabParam === 'gallery' ? tabParam : 'details';
  });

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

  // Handle tab changes and update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams);
    if (tab === 'details') {
      // Remove tab parameter for default tab to keep URL clean
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

      <EventDescription
        event={event}
        isOwner={!!(user?.id && event.owner?.id && user.id === event.owner.id)}
      />

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

  const renderCommentsTab = () => (
    <EventComments eventId={eventId} />
  );

  const renderGalleryTab = () => {
    // Check if there are any gallery images
    if (!event.galleryImages || event.galleryImages.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <svg
            className='mb-4 h-12 w-12 text-gray-300'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>No Photos Yet</h3>
          <p className='text-center text-sm text-gray-500'>
            Photos from this event will appear here once they're added.
          </p>
        </div>
      );
    }

    return (
      <EventGallery
        event={event}
        currentUserId={user?.id || ''}
        onImageClick={(index) => {
          setSelectedGalleryImageIndex(index);
        }}
      />
    );
  };

  // Format cover images for LightboxViewer
  const formattedCoverImages = useMemo(() => {
    if (!event) return [];
    return event.coverImages.map((imageUrl, index) => ({
      id: `cover-${index}`,
      image: imageUrl,
      user_details: null, // No user details for cover images
      created_at: new Date().toISOString(),
    }));
  }, [event]);

  // Format gallery images for LightboxViewer
  const formattedGalleryImages = useMemo(() => {
    if (!event) return [];
    return (event.galleryImages || []).map((imageUrl, index) => ({
      id: `gallery-${index}`,
      image: imageUrl,
      user_details: null, // Could be enhanced later if gallery images have user data
      created_at: new Date().toISOString(),
    }));
  }, [event]);

  // Placeholder delete handler (covers shouldn't be deletable from lightbox)
  const handleImageDelete = async (photoId: string) => {
    return { success: false };
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Main content */}
      <div className='mx-auto max-w-full bg-white md:max-w-sm'>
        <SwipeableHeader
          event={event}
          onImageClick={(index) => {
            setSelectedCoverImageIndex(index);
          }}
        />
        <div className='pb-20'>
          <div className='px-4'>
            <EventInfo event={event} currentUserId={user?.id || ''} />
          </div>

          {/* Tabbed Section */}
          <div className='bg-white'>
            {/* Tab Headers with top border */}
            <div className='border-t border-gray-100'>
              <div className='flex gap-2 px-4 py-3'>
                <button
                  onClick={() => handleTabChange('details')}
                  className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                    activeTab === 'details'
                      ? 'bg-gray-100 text-black'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => handleTabChange('comments')}
                  className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                    activeTab === 'comments'
                      ? 'bg-gray-100 text-black'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Comments
                </button>
                <button
                  onClick={() => handleTabChange('gallery')}
                  className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                    activeTab === 'gallery'
                      ? 'bg-gray-100 text-black'
                      : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Gallery
                </button>
              </div>
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

      {/* Cover Images Lightbox */}
      <LightboxViewer
        images={formattedCoverImages}
        selectedImage={selectedCoverImageIndex}
        onClose={() => setSelectedCoverImageIndex(null)}
        onImageChange={setSelectedCoverImageIndex}
        showDropdownMenu={false}
        handleDelete={handleImageDelete}
        userId={user?.id || ''}
        eventId={eventId}
      />

      {/* Gallery Images Lightbox */}
      <LightboxViewer
        images={formattedGalleryImages}
        selectedImage={selectedGalleryImageIndex}
        onClose={() => setSelectedGalleryImageIndex(null)}
        onImageChange={setSelectedGalleryImageIndex}
        showDropdownMenu={false}
        handleDelete={handleImageDelete}
        userId={user?.id || ''}
        eventId={eventId}
      />
    </div>
  );
}
