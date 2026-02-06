'use client';

import EventComments from '@/components/event-detail/event-comments';
import EventContributions from '@/components/event-detail/event-contributions';
import EventDescription from '@/components/event-detail/event-description';
import EventGallery from '@/components/event-detail/event-gallery';
import EventGuestsSection from '@/components/event-detail/event-guests-section';
import EventHost from '@/components/event-detail/event-host';
import EventInfo from '@/components/event-detail/event-info';
import EventLocation from '@/components/event-detail/event-location';
import { EventPasswordGate } from '@/components/event-detail/event-password-gate';
import { EventSpotifyEmbed } from '@/components/event-detail/event-spotify-embed';
import EventSubEvents from '@/components/event-detail/event-sub-events';
import { WavlakeEmbed } from '@/components/event-detail/event-wavlake-embed';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { LightboxViewer } from '@/components/lightbox-viewer';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventHosts } from '@/lib/hooks/use-event-hosts';
import { useEventWeather } from '@/lib/hooks/use-event-weather';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { useTopBar } from '@/lib/stores/topbar-store';
import { PasswordProtectedEventResponse, RSVPStatus } from '@/lib/types/api';
import { hasEventAccess } from '@/lib/utils/event-access';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Share } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function EventDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [passwordAccessGranted, setPasswordAccessGranted] = useState(false);

  // RSVP hooks for handling post-auth RSVP processing
  const {
    data: userRsvpData,
    isLoading: isUserRsvpLoading,
    isFetching: isUserRsvpFetching,
  } = useUserRSVP(eventId);
  const upsertRsvp = useUpsertRSVP();
  const hasProcessedPendingRsvpRef = useRef(false);

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

  // Handle post-authentication RSVP processing
  useEffect(() => {
    const rsvpParam = searchParams.get('rsvp') as RSVPStatus | null;
    const eventIdParam = searchParams.get('eventId');

    const hasPendingParam = !!rsvpParam && ['yes', 'maybe', 'no'].includes(rsvpParam);
    if (!isAuthenticated || !hasPendingParam || eventIdParam !== eventId) return;

    // Prevent double-processing on rerenders or search param changes
    if (hasProcessedPendingRsvpRef.current) return;

    // Avoid overlapping mutations
    if (upsertRsvp.isPending || upsertRsvp.isSuccess) return;

    // Wait until user RSVP query has settled so we know if an RSVP exists
    const querySettled = !isUserRsvpLoading && !isUserRsvpFetching;
    if (!querySettled) return;

    hasProcessedPendingRsvpRef.current = true;
    const hasExisting = !!userRsvpData?.rsvp;

    upsertRsvp.mutate(
      { eventId, status: rsvpParam as RSVPStatus, hasExisting },
      {
        onSuccess: () => {
          const msg =
            rsvpParam === 'yes'
              ? "You're going"
              : rsvpParam === 'maybe'
                ? 'Marked as maybe'
                : 'You are not going';
          toast.success(msg);

          // Clean up URL params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rsvp');
          newParams.delete('eventId');
          const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
          router.replace(newUrl, { scroll: false });
        },
        onError: () => {
          toast.error('Failed to update RSVP. Please try again.');

          // Clean up URL params even on error
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rsvp');
          newParams.delete('eventId');
          const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
          router.replace(newUrl, { scroll: false });
        },
      }
    );
  }, [
    isAuthenticated,
    searchParams,
    eventId,
    pathname,
    router,
    upsertRsvp.isPending,
    upsertRsvp.isSuccess,
    isUserRsvpLoading,
    isUserRsvpFetching,
    userRsvpData,
  ]);

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
          logger.error('Error sharing', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      leftMode: 'back',
      centerMode: 'title',
      title: event?.title || '',
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
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig, event?.title]);

  const isLoading = eventLoading || hostsLoading || galleryLoading;

  // Check if user should bypass password protection
  const shouldBypassPasswordGate = useMemo(() => {
    if (!eventData?.password_protected) return true; // Not password protected
    if (passwordAccessGranted) return true; // Just granted access via password

    // Check localStorage for previous access
    if (hasEventAccess(eventId)) return true;

    // Check if user is a host or co-host
    if (user && hostsData.some((host) => host.id === user.id)) return true;

    // Check if user is the creator
    if (user && eventData.creator_user_id === user.id) return true;

    // Check if user has RSVP'd 'yes'
    if (userRsvpData?.status === 'yes') return true;

    return false;
  }, [
    eventData?.password_protected,
    eventData?.creator_user_id,
    passwordAccessGranted,
    eventId,
    user,
    hostsData,
    userRsvpData?.status,
  ]);

  // Show password gate if event is password protected and user doesn't have access
  if (!isLoading && eventData?.password_protected && !shouldBypassPasswordGate) {
    const passwordProtectedEvent: PasswordProtectedEventResponse = {
      id: eventData.id,
      title: eventData.title,
      cover: eventData.cover,
      password_protected: true,
      hosts: hostsData.map((h) => ({
        id: h.id,
        name: h.name,
        username: h.username,
        avatar: h.avatar || h.image || '',
        image: h.image,
      })),
    };

    return (
      <EventPasswordGate
        event={passwordProtectedEvent}
        onAccessGranted={() => setPasswordAccessGranted(true)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='mx-auto max-w-full bg-white md:max-w-sm'>
          <Skeleton variant='event-details' />
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
      {eventData && <EventContributions eventData={eventData} eventId={eventId} />}
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
          setSelectedImageIndex(index);
        }}
      />
    );
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Main content */}
      <div className='mx-auto max-w-full bg-white md:pt-4 lg:max-w-4xl'>
        <div className='lg:flex lg:gap-8'>
          {/* Left Column - Image & Quick Actions (sticky on desktop) */}
          <div className='lg:sticky lg:top-0 lg:w-1/2 lg:self-start'>
            <SwipeableHeader
              event={event}
              onImageClick={(index) => {
                setLightboxImages(event.coverImages);
                setSelectedImageIndex(index);
              }}
            />
            <div className='px-4'>
              <EventInfo
                event={event}
                currentUserId={user?.id || ''}
                eventData={eventData}
                hosts={hostsData}
              />
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className='pb-20 lg:w-1/2'>
            {/* Tabbed Section */}
            <div className='mb-4 w-full bg-white'>
              {/* Tab Headers */}
              <SegmentedTabs
                items={[
                  { value: 'details', label: 'Details' },
                  { value: 'comments', label: 'Comments' },
                  { value: 'gallery', label: 'Gallery' },
                ]}
                value={activeTab}
                onValueChange={(v) => handleTabChange(v)}
              />

              {/* Tab Content */}
              <div className='px-4'>
                {activeTab === 'details' && renderDetailsTab()}
                {activeTab === 'comments' && renderCommentsTab()}
                {activeTab === 'gallery' && renderGalleryTab()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <LightboxViewer
        images={lightboxImages}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={setSelectedImageIndex}
        showDropdownMenu={false}
        handleDelete={async (photoId: string) => {
          return { success: false };
        }}
        userId={user?.id || ''}
        eventId={event.id}
      />
    </div>
  );
}
