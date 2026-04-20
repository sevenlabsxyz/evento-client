'use client';

import EventCampaignCard from '@/components/event-detail/event-campaign-card';
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
import SaveEventSheet from '@/components/event-detail/save-event-sheet';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventHosts } from '@/lib/hooks/use-event-hosts';
import { useEventWeather } from '@/lib/hooks/use-event-weather';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { useTopBarStore } from '@/lib/stores/topbar-store';
import { PasswordProtectedEventResponse, RSVPStatus } from '@/lib/types/api';
import { getInitialAppPath, hasAppNavigated, setInitialAppPath } from '@/lib/utils/app-session';
import { hasEventAccess } from '@/lib/utils/event-access';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Bookmark, Image, Info, MessageSquare, Share } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const EVENT_DETAIL_SECTION_IDS = ['details', 'comments', 'gallery'] as const;

export default function EventDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const setTopBarForRoute = useTopBarStore((s) => s.setTopBarForRoute);
  const applyRouteConfig = useTopBarStore((s) => s.applyRouteConfig);
  const clearRoute = useTopBarStore((s) => s.clearRoute);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [passwordAccessGranted, setPasswordAccessGranted] = useState(false);
  const cameFromManage = searchParams.get('from') === 'manage';
  const detailsSectionRef = useRef<HTMLElement | null>(null);
  const commentsSectionRef = useRef<HTMLElement | null>(null);
  const gallerySectionRef = useRef<HTMLElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isApplyingInitialDeepLinkRef = useRef(false);

  // RSVP hooks for handling post-auth RSVP processing
  const {
    data: userRsvpData,
    isLoading: isUserRsvpLoading,
    isFetching: isUserRsvpFetching,
  } = useUserRSVP(eventId);
  const upsertRsvp = useUpsertRSVP();
  const hasProcessedPendingRsvpRef = useRef(false);

  const sectionIds = EVENT_DETAIL_SECTION_IDS;

  const updateTabUrl = useCallback(
    (tab: (typeof sectionIds)[number]) => {
      const newParams = new URLSearchParams(searchParams);
      if (tab === 'details') {
        newParams.delete('tab');
      } else {
        newParams.set('tab', tab);
      }

      const queryString = newParams.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const getSectionElement = useCallback((tab: (typeof sectionIds)[number]) => {
    if (tab === 'details')
      return detailsSectionRef.current ?? document.querySelector('#event-section-details');
    if (tab === 'comments')
      return commentsSectionRef.current ?? document.querySelector('#event-section-comments');
    return gallerySectionRef.current ?? document.querySelector('#event-section-gallery');
  }, []);

  // Handle tab changes by scrolling to the matching section and updating the URL.
  const handleTabChange = useCallback(
    (tab: (typeof sectionIds)[number]) => {
      setActiveTab(tab);
      updateTabUrl(tab);

      const sectionElement = getSectionElement(tab);
      if (!sectionElement) {
        return;
      }

      isProgrammaticScrollRef.current = true;
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    },
    [getSectionElement, updateTabUrl]
  );

  // Sync active tab from the URL and keep deep links working.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const nextTab =
      tabParam && sectionIds.includes(tabParam as (typeof sectionIds)[number])
        ? (tabParam as (typeof sectionIds)[number])
        : 'details';

    setActiveTab(nextTab);

    isApplyingInitialDeepLinkRef.current = nextTab !== 'details';

    if (nextTab === 'details') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const sectionElement = getSectionElement(nextTab);
      if (!sectionElement) {
        isApplyingInitialDeepLinkRef.current = false;
        return;
      }

      isProgrammaticScrollRef.current = true;
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        isApplyingInitialDeepLinkRef.current = false;
      }, 400);
    }, 0);

    return () => {
      isApplyingInitialDeepLinkRef.current = false;
      window.clearTimeout(timeoutId);
    };
  }, [getSectionElement, searchParams, sectionIds]);

  // Keep the selected tab in sync with the section nearest the top of the viewport.
  useEffect(() => {
    const sections = [
      { id: 'details' as const, element: detailsSectionRef.current },
      { id: 'comments' as const, element: commentsSectionRef.current },
      { id: 'gallery' as const, element: gallerySectionRef.current },
    ].filter((section): section is { id: (typeof sectionIds)[number]; element: HTMLElement } =>
      Boolean(section.element)
    );

    if (sections.length === 0) {
      return;
    }

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || isApplyingInitialDeepLinkRef.current) {
        return;
      }

      const nextActiveSection = sections.reduce(
        (closest, section) => {
          const distanceFromTop = Math.abs(section.element.getBoundingClientRect().top - 96);

          if (!closest || distanceFromTop < closest.distanceFromTop) {
            return { id: section.id, distanceFromTop };
          }

          return closest;
        },
        null as { id: (typeof sectionIds)[number]; distanceFromTop: number } | null
      );

      if (!nextActiveSection || nextActiveSection.id === activeTab) {
        return;
      }

      setActiveTab(nextActiveSection.id);
      updateTabUrl(nextActiveSection.id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, sectionIds, updateTabUrl]);

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
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update RSVP. Please try again.');

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
    upsertRsvp.mutate,
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

  const isOwnerOrCohost = useMemo(() => {
    if (!user?.id) return false;
    if (eventData?.creator_user_id === user.id) return true;
    return hostsData.some((host) => host.user_details?.id === user.id);
  }, [eventData?.creator_user_id, hostsData, user?.id]);

  const { data: registrationSettings } = useRegistrationSettings(eventId);
  const { data: myRegistration } = useMyRegistration(eventId);

  // Approved attendee = RSVP 'yes' + approval (when registration is required).
  // Password access alone does NOT make someone approved.
  const isApprovedAttendee = useMemo(() => {
    if (isOwnerOrCohost) return true;
    if (userRsvpData?.status !== 'yes') return false;
    const registrationRequired =
      eventData?.type !== undefined
        ? eventData.type !== 'rsvp'
        : (registrationSettings?.registration_required ?? false);
    if (registrationRequired) {
      return myRegistration?.registration?.approval_status === 'approved';
    }
    return true;
  }, [
    isOwnerOrCohost,
    userRsvpData?.status,
    eventData?.type,
    registrationSettings,
    myRegistration,
  ]);

  const visibilitySettings = eventData?.visibility_settings;

  // Precompute topbar-relevant values as stable primitives to avoid
  // object/array deps in the effect that trigger infinite re-renders.
  const eventTitle = event?.title || '';
  const isPasswordProtected = !!eventData?.password_protected;
  const creatorUserId = eventData?.creator_user_id || '';
  const rsvpStatus = userRsvpData?.status;

  const isOverlaid = useMemo(() => {
    if (!isPasswordProtected) return false;
    if (passwordAccessGranted) return false;
    if (hasEventAccess(eventId)) return false;
    if (isOwnerOrCohost) return false;
    if (rsvpStatus === 'yes') return false;
    return true;
  }, [isPasswordProtected, passwordAccessGranted, eventId, isOwnerOrCohost, rsvpStatus]);

  // Effect 1: Route lifecycle — mount/unmount only.
  // applyRouteConfig on mount, clearRoute on unmount.
  useEffect(() => {
    const initialPath = getInitialAppPath();
    if (!initialPath) {
      setInitialAppPath(pathname);
    }
    applyRouteConfig(pathname);
    return () => {
      clearRoute(pathname);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Effect 2: TopBar config updates — reacts to data changes.
  // No cleanup (clearRoute is handled above). Only primitive deps.
  useEffect(() => {
    const initialPath = getInitialAppPath();
    const resolvedInitialPath = initialPath ?? pathname;
    const isDirectLanding = resolvedInitialPath === pathname && !hasAppNavigated();

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

    setTopBarForRoute(pathname, {
      leftMode: isDirectLanding ? 'logo' : 'back',
      onBackPress: cameFromManage ? () => router.push(isAuthenticated ? '/e/hub' : '/') : null,
      centerMode: 'title',
      title: eventTitle,
      showAvatar: false,
      hideMobileBreadcrumb: true,
      buttons: [
        {
          id: 'share',
          icon: Share,
          onClick: handleShare,
          label: 'Share',
        },
        ...(!isOwnerOrCohost
          ? [
              {
                id: 'save-event',
                icon: Bookmark,
                onClick: () => setShowSaveSheet(true),
                label: 'Save Event',
              },
            ]
          : []),
      ],
      isOverlaid,
    });
  }, [
    pathname,
    setTopBarForRoute,
    eventTitle,
    isOwnerOrCohost,
    isOverlaid,
    cameFromManage,
    router,
    isAuthenticated,
  ]);

  const isLoading = eventLoading || hostsLoading || galleryLoading;

  // Check if user should bypass password protection
  const shouldBypassPasswordGate = useMemo(() => {
    if (!eventData?.password_protected) return true; // Not password protected
    if (passwordAccessGranted) return true; // Just granted access via password

    // Check localStorage for previous access
    if (hasEventAccess(eventId)) return true;

    // Check if user is a host or co-host
    if (user && hostsData.some((host) => host.user_details?.id === user.id)) return true;

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
      hosts: hostsData.flatMap((host) => {
        if (!host.user_details) {
          return [];
        }

        return [
          {
            id: host.user_details.id,
            name: host.user_details.name || '',
            username: host.user_details.username,
            avatar: host.user_details.image || '',
            image: host.user_details.image || undefined,
          },
        ];
      }),
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
          <p className='mb-4 text-gray-600'>
            The event you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            type='button'
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
      {/* Campaign card */}
      <EventCampaignCard eventId={eventId} hasCampaign={event.has_campaign} />
      {eventData && <EventContributions eventData={eventData} eventId={eventId} />}
      {!isApprovedAttendee &&
      registrationSettings?.registration_required &&
      visibilitySettings &&
      (visibilitySettings.hide_location_for_unapproved ||
        visibilitySettings.hide_description_for_unapproved ||
        visibilitySettings.hide_guest_list_for_unapproved) ? (
        <div className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
          Some event details are hidden until your registration is approved.
        </div>
      ) : null}
      {!(visibilitySettings?.hide_guest_list_for_unapproved && !isApprovedAttendee) && (
        <EventGuestsSection
          eventId={eventId}
          eventCreatorUserId={eventData?.creator_user_id || ''}
          hosts={hostsData}
          currentUserId={user?.id || ''}
        />
      )}
      {!(visibilitySettings?.hide_description_for_unapproved && !isApprovedAttendee) && (
        <EventDescription event={event} />
      )}
      {(subEventsLoading || subEvents.length > 0 || subEventsError) && (
        <EventSubEvents
          subEvents={subEvents}
          subEventsLoading={subEventsLoading}
          subEventsError={subEventsError}
        />
      )}
      {!(visibilitySettings?.hide_location_for_unapproved && !isApprovedAttendee) && (
        <EventLocation event={event} weather={weather} />
      )}

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
    <div className='border-t border-gray-100 py-6'>
      <h2 className='mb-4 text-lg font-semibold text-gray-900'>Comments</h2>
      <EventComments eventId={event.id} />
    </div>
  );

  const renderGalleryTab = () => {
    return (
      <div className='border-t border-gray-100 py-6'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>Gallery</h2>
        <EventGallery
          event={event}
          onImageClick={(index) => {
            setLightboxImages(event.galleryImages || []);
            setSelectedImageIndex(index);
          }}
        />
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-white'>
      {/* Main content */}
      <div className='mx-auto max-w-full bg-white md:pt-4 lg:max-w-4xl'>
        <div className='pt-4 md:pt-0 lg:flex lg:gap-8'>
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

          {/* Right Column - Section navigation */}
          <div className='pb-20 lg:w-1/2'>
            <div className='mb-4 w-full bg-white'>
              <AnimatedTabs
                expanded
                className='mx-auto'
                tabs={[
                  { title: 'Details', icon: Info, onClick: () => handleTabChange('details') },
                  {
                    title: 'Comments',
                    icon: MessageSquare,
                    onClick: () => handleTabChange('comments'),
                  },
                  { title: 'Gallery', icon: Image, onClick: () => handleTabChange('gallery') },
                ]}
                selected={sectionIds.indexOf(activeTab as (typeof sectionIds)[number])}
              />

              <div className='space-y-6 px-4'>
                <section
                  id='event-section-details'
                  ref={(element) => {
                    detailsSectionRef.current = element;
                  }}
                  className='scroll-mt-24 space-y-6'
                >
                  {renderDetailsTab()}
                </section>

                <section
                  id='event-section-comments'
                  ref={(element) => {
                    commentsSectionRef.current = element;
                  }}
                  className='scroll-mt-24'
                >
                  {renderCommentsTab()}
                </section>

                <section
                  id='event-section-gallery'
                  ref={(element) => {
                    gallerySectionRef.current = element;
                  }}
                  className='scroll-mt-24'
                >
                  {renderGalleryTab()}
                </section>
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

      {!isOwnerOrCohost && (
        <SaveEventSheet
          isOpen={showSaveSheet}
          onClose={() => setShowSaveSheet(false)}
          eventId={event.id}
        />
      )}
    </div>
  );
}
