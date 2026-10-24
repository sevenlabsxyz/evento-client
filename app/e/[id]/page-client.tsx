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
import { EventSection } from '@/components/event-detail/event-section';
import { EventSpotifyEmbed } from '@/components/event-detail/event-spotify-embed';
import EventSubEvents from '@/components/event-detail/event-sub-events';
import { WavlakeEmbed } from '@/components/event-detail/event-wavlake-embed';
import SaveEventSheet from '@/components/event-detail/save-event-sheet';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useEventHosts } from '@/lib/hooks/use-event-hosts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useEventWeather } from '@/lib/hooks/use-event-weather';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import type { Translator } from '@/lib/i18n/types';
import { useTopBarStore } from '@/lib/stores/topbar-store';
import { PasswordProtectedEventResponse, RSVPStatus } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { cn } from '@/lib/utils';
import { getInitialAppPath, hasAppNavigated, setInitialAppPath } from '@/lib/utils/app-session';
import { hasEventAccess } from '@/lib/utils/event-access';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { getOptimizedImageUrlPreservingGif } from '@/lib/utils/image';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import {
  Bookmark,
  CalendarX,
  EyeOff,
  Image,
  Info,
  MessageSquare,
  Share,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loading from './loading';

const EVENT_DETAIL_SECTION_IDS = ['details', 'comments', 'gallery'] as const;

const QUICK_ACTION_CLASS =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

function formatHostNames(hosts: EventDetail['hosts'], t: Translator<'event'>): string {
  const names = hosts.map((host) => host.name || `@${host.username}`);
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return t('page.twoHosts', { first: names[0], second: names[1] });
  return t('page.manyHosts', { first: names[0], count: names.length - 1 });
}

export default function EventDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated } = useAuth();
  const setTopBarForRoute = useTopBarStore((s) => s.setTopBarForRoute);
  const applyRouteConfig = useTopBarStore((s) => s.applyRouteConfig);
  const clearRoute = useTopBarStore((s) => s.clearRoute);
  const [lightboxSource, setLightboxSource] = useState<'cover' | 'gallery'>('cover');
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
  const resetTabHighlightTimeoutRef = useRef<number | null>(null);

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

  const scheduleDetailsTabReset = useCallback(() => {
    if (resetTabHighlightTimeoutRef.current !== null) {
      window.clearTimeout(resetTabHighlightTimeoutRef.current);
    }

    resetTabHighlightTimeoutRef.current = window.setTimeout(() => {
      setActiveTab('details');
      resetTabHighlightTimeoutRef.current = null;
    }, 1000);
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
      if (tab !== 'details') {
        scheduleDetailsTabReset();
      }
    },
    [getSectionElement, scheduleDetailsTabReset, updateTabUrl]
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
        scheduleDetailsTabReset();
      }, 400);
    }, 0);

    return () => {
      isApplyingInitialDeepLinkRef.current = false;
      if (resetTabHighlightTimeoutRef.current !== null) {
        window.clearTimeout(resetTabHighlightTimeoutRef.current);
        resetTabHighlightTimeoutRef.current = null;
      }
      window.clearTimeout(timeoutId);
    };
  }, [getSectionElement, scheduleDetailsTabReset, searchParams, sectionIds]);

  // The tabs now act as section jump links, so reset their visual state back to Details after navigation.
  useEffect(() => {
    return () => {
      if (resetTabHighlightTimeoutRef.current !== null) {
        window.clearTimeout(resetTabHighlightTimeoutRef.current);
      }
    };
  }, []);

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
              ? t('page.rsvpGoing')
              : rsvpParam === 'maybe'
                ? t('page.rsvpMaybe')
                : t('page.rsvpNotGoing');
          toast.success(msg);

          // Clean up URL params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('rsvp');
          newParams.delete('eventId');
          const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
          router.replace(newUrl, { scroll: false });
        },
        onError: (error: Error) => {
          toast.error(error.message || t('page.rsvpFailed'));

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
    t,
  ]);

  // Fetch event data from API
  const { data: eventData, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
  const { data: hostsData = [], isLoading: hostsLoading } = useEventHosts(eventId);
  const { data: galleryData = [], isLoading: galleryLoading } = useEventGallery(eventId);
  const { mutateAsync: deleteGalleryItem } = useDeleteGalleryItem();
  const {
    data: subEvents = [],
    isLoading: subEventsLoading,
    error: subEventsError,
  } = useSubEvents(eventId);
  // Same query EventInfo/EventGuestsSection already run; react-query dedupes it.
  const { data: eventRsvps } = useEventRSVPs(eventId);
  const goingGuests = useMemo(
    () => (eventRsvps ?? []).filter((rsvp) => rsvp.status === 'yes'),
    [eventRsvps]
  );

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

  const galleryLightboxImages = useMemo(
    () =>
      galleryData.map((item) => ({
        id: item.id,
        image: getOptimizedImageUrlPreservingGif(item.url, 1200, 90),
        user_details: item.user_details,
        created_at: item.created_at,
      })),
    [galleryData]
  );
  const selectedGalleryItem =
    lightboxSource !== 'gallery' || selectedImageIndex === null
      ? null
      : galleryData[selectedImageIndex] || null;
  const canDeleteSelectedGalleryItem = Boolean(
    selectedGalleryItem && (isOwnerOrCohost || selectedGalleryItem.user_details?.id === user?.id)
  );

  const handleDeleteGalleryItem = useCallback(
    async (photoId: string) => {
      try {
        await deleteGalleryItem({ galleryItemId: photoId, eventId });
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [deleteGalleryItem, eventId]
  );

  const { data: registrationSettings } = useRegistrationSettings(eventId);
  const { data: myRegistration } = useMyRegistration(eventId);

  const registrationRequired =
    eventData?.type !== undefined
      ? eventData.type !== 'rsvp'
      : (registrationSettings?.registration_required ?? false);

  // Approved attendee = RSVP 'yes' + approval (when registration is required).
  // Password access alone does NOT make someone approved.
  const isApprovedAttendee = useMemo(() => {
    if (isOwnerOrCohost) return true;
    if (userRsvpData?.status !== 'yes') return false;
    if (registrationRequired) {
      return myRegistration?.registration?.approval_status === 'approved';
    }
    return true;
  }, [isOwnerOrCohost, userRsvpData?.status, registrationRequired, myRegistration]);

  const visibilitySettings = eventData?.visibility_settings;
  const isGuestListHidden =
    Boolean(visibilitySettings?.hide_guest_list_for_unapproved) && !isApprovedAttendee;
  const hasHiddenDetails =
    !isApprovedAttendee &&
    Boolean(
      visibilitySettings &&
      (visibilitySettings.hide_location_for_unapproved ||
        visibilitySettings.hide_description_for_unapproved ||
        visibilitySettings.hide_guest_list_for_unapproved)
    );

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

  const handleShare = useCallback(async () => {
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
  }, []);

  // Effect 2: TopBar config updates — reacts to data changes.
  // No cleanup (clearRoute is handled above). Only primitive deps.
  useEffect(() => {
    const initialPath = getInitialAppPath();
    const resolvedInitialPath = initialPath ?? pathname;
    const isDirectLanding = resolvedInitialPath === pathname && !hasAppNavigated();

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
          label: tCommon('actions.share'),
        },
        ...(!isOwnerOrCohost
          ? [
              {
                id: 'save-event',
                icon: Bookmark,
                onClick: () => setShowSaveSheet(true),
                label: t('page.saveEvent'),
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
    handleShare,
    t,
    tCommon,
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
    return <Loading />;
  }

  if (eventError || !event) {
    return (
      <div className='flex min-h-full w-full items-center justify-center bg-white px-4 py-16 dark:bg-neutral-900'>
        <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-neutral-800'>
            <CalendarX className='h-6 w-6 text-gray-500 dark:text-neutral-400' aria-hidden='true' />
          </div>
          <h1 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('page.notFoundTitle')}
          </h1>
          <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
            {t('page.notFoundDescription')}
          </p>
          <div className='mt-6 flex flex-col gap-2 sm:flex-row'>
            <Button
              type='button'
              variant='outline'
              className='flex-1 rounded-full dark:bg-neutral-900 dark:hover:bg-neutral-800'
              onClick={() => router.back()}
            >
              {t('page.goBack')}
            </Button>
            <Button asChild className='flex-1 rounded-full'>
              <Link href={isAuthenticated ? '/e/hub' : '/'}>{t('page.exploreEvents')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderDetailsTab = () => (
    <>
      <EventHost event={event} />
      {/* Campaign card */}
      <EventCampaignCard eventId={eventId} hasCampaign={event.has_campaign} />
      {eventData && <EventContributions eventData={eventData} eventId={eventId} />}
      {hasHiddenDetails && (
        <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'>
          <EyeOff className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          <p>{registrationRequired ? t('page.hiddenUntilApproved') : t('page.hiddenUntilRsvp')}</p>
        </div>
      )}
      {!isGuestListHidden && (
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
      {(subEventsLoading || subEvents.length > 0 || subEventsError || isOwnerOrCohost) && (
        <EventSubEvents
          eventId={eventId}
          isHost={isOwnerOrCohost}
          parentTimezone={eventData?.timezone || event.timezone || 'UTC'}
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
        <EventSection title={t('page.music')} variant='plain' bodyClassName='space-y-4'>
          {eventData.spotify_url && <EventSpotifyEmbed link={eventData.spotify_url} />}
          {eventData.wavlake_url && <WavlakeEmbed link={eventData.wavlake_url} />}
        </EventSection>
      )}
    </>
  );

  const summaryHosts = event.hosts ?? [];
  const summaryGuests = goingGuests.slice(0, 3);
  const showGuestSummary = !isGuestListHidden && goingGuests.length > 0;

  return (
    <div className='min-h-full w-full bg-white dark:bg-neutral-900'>
      <div className='mx-auto w-full max-w-2xl px-4 pb-20 pt-4 md:px-8 md:pb-16 md:pt-8 lg:max-w-6xl'>
        <div className='lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10'>
          {/* Left column — cover stays in view on desktop with host/guest summary + quick actions */}
          <aside className='space-y-4 lg:sticky lg:top-6 lg:self-start'>
            <SwipeableHeader
              event={event}
              onImageClick={(index) => {
                setLightboxSource('cover');
                setSelectedImageIndex(index);
              }}
            />

            <div className='hidden space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:block'>
              {summaryHosts.length > 0 && (
                <div className='flex items-center gap-3'>
                  <div className='flex shrink-0 -space-x-2'>
                    {summaryHosts.slice(0, 3).map((host) => (
                      <UserAvatar
                        key={host.id}
                        user={{ name: host.name, username: host.username, image: host.avatar }}
                        size='sm'
                        className='rounded-full ring-2 ring-white dark:ring-neutral-900'
                      />
                    ))}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium text-gray-500 dark:text-neutral-500'>
                      {t('page.hostedBy')}
                    </p>
                    <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                      {formatHostNames(summaryHosts, t)}
                    </p>
                  </div>
                </div>
              )}

              {showGuestSummary && (
                <div className='flex items-center gap-3'>
                  {summaryGuests.some((guest) => guest.user_details) ? (
                    <div className='flex shrink-0 -space-x-2'>
                      {summaryGuests.map((guest) => (
                        <UserAvatar
                          key={guest.id}
                          user={{
                            name: guest.user_details?.name,
                            username: guest.user_details?.username,
                            image: guest.user_details?.image,
                          }}
                          size='sm'
                          className='rounded-full ring-2 ring-white dark:ring-neutral-900'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800'>
                      <Users className='h-4 w-4 text-gray-500 dark:text-neutral-400' />
                    </div>
                  )}
                  <p className='text-sm text-gray-600 dark:text-neutral-400'>
                    {t.rich('page.goingCount', {
                      count: goingGuests.length,
                      strong: (chunks) => (
                        <span className='font-semibold text-gray-900 dark:text-neutral-100'>
                          {chunks}
                        </span>
                      ),
                    })}
                  </p>
                </div>
              )}

              <div
                className={cn(
                  'grid gap-2',
                  isOwnerOrCohost ? 'grid-cols-1' : 'grid-cols-2',
                  (summaryHosts.length > 0 || showGuestSummary) &&
                    'border-t border-gray-100 pt-4 dark:border-neutral-800'
                )}
              >
                <button type='button' onClick={handleShare} className={QUICK_ACTION_CLASS}>
                  <Share className='h-4 w-4' aria-hidden='true' />
                  {tCommon('actions.share')}
                </button>
                {!isOwnerOrCohost && (
                  <button
                    type='button'
                    onClick={() => setShowSaveSheet(true)}
                    className={QUICK_ACTION_CLASS}
                  >
                    <Bookmark className='h-4 w-4' aria-hidden='true' />
                    {tCommon('actions.save')}
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Right column — hero, section nav, sections */}
          <div className='min-w-0 pt-6 lg:pt-0'>
            <EventInfo
              event={event}
              currentUserId={user?.id || ''}
              eventData={eventData}
              hosts={hostsData}
            />

            <nav
              aria-label={t('page.sectionsNav')}
              className='sticky top-0 z-20 -mx-4 mb-6 mt-8 border-b border-gray-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900 md:-mx-8 md:px-8 lg:mx-0 lg:px-0'
            >
              <AnimatedTabs
                expanded
                className='mx-auto lg:mx-0'
                tabs={[
                  {
                    title: t('page.tabs.details'),
                    icon: Info,
                    onClick: () => handleTabChange('details'),
                  },
                  {
                    title: t('page.tabs.comments'),
                    icon: MessageSquare,
                    onClick: () => handleTabChange('comments'),
                  },
                  {
                    title: t('page.tabs.gallery'),
                    icon: Image,
                    onClick: () => handleTabChange('gallery'),
                  },
                ]}
                selected={sectionIds.indexOf(activeTab as (typeof sectionIds)[number])}
              />
            </nav>

            <div className='space-y-10'>
              <section
                id='event-section-details'
                ref={(element) => {
                  detailsSectionRef.current = element;
                }}
                className='scroll-mt-24 space-y-8'
              >
                {renderDetailsTab()}
              </section>

              <EventSection
                id='event-section-comments'
                ref={(element) => {
                  commentsSectionRef.current = element;
                }}
                title={t('page.tabs.comments')}
              >
                <EventComments eventId={event.id} isEventHost={isOwnerOrCohost} />
              </EventSection>

              <EventSection
                id='event-section-gallery'
                ref={(element) => {
                  gallerySectionRef.current = element;
                }}
                title={t('page.photos')}
                variant='plain'
              >
                <EventGallery
                  event={event}
                  galleryItems={galleryData}
                  currentUserId={user?.id || ''}
                  isEventHost={isOwnerOrCohost}
                  onImageClick={(index) => {
                    setLightboxSource('gallery');
                    setSelectedImageIndex(index);
                  }}
                />
              </EventSection>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <LightboxViewer
        images={lightboxSource === 'gallery' ? galleryLightboxImages : event.coverImages}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={setSelectedImageIndex}
        showDropdownMenu={canDeleteSelectedGalleryItem}
        handleDelete={handleDeleteGalleryItem}
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
