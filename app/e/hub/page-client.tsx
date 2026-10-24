'use client';

import { BuildWithEventoCard } from '@/components/hub/build-with-evento-card';
import { DiscoverSection } from '@/components/hub/discover-section';
import { GetStartedCard } from '@/components/hub/get-started-card';
import { HubBlogGallery } from '@/components/hub/hub-blog-gallery';
import { HubBlogRail } from '@/components/hub/hub-blog-rail';
import { HubGreeting } from '@/components/hub/hub-greeting';
import { MyEventsSection } from '@/components/hub/my-events-section';
import { NeedsResponseSection } from '@/components/hub/needs-response-section';
import { UpNextCard } from '@/components/hub/up-next-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useMyCohostInvites } from '@/lib/hooks/use-cohost-invites';
import { useHubData } from '@/lib/hooks/use-hub-data';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';
import { useTopBar } from '@/lib/stores/topbar-store';
import { GhostPost } from '@/lib/types/ghost';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const PAGE_BACKGROUND_CLASS = 'min-h-full w-full bg-white dark:bg-neutral-900';
const PAGE_CONTAINER_CLASS =
  'mx-auto w-full max-w-7xl space-y-6 px-4 pb-40 pt-4 md:px-8 md:pb-16 md:pt-8';
const SKELETON_PANEL_CLASS =
  'rounded-3xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900';

function HubPageSkeleton() {
  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-36' />
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-44' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-10 flex-1 rounded-full md:w-32 md:flex-none' />
            <Skeleton className='h-10 flex-1 rounded-full md:w-28 md:flex-none' />
          </div>
        </div>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <div className='min-w-0 space-y-8'>
            <div className={SKELETON_PANEL_CLASS}>
              <Skeleton className='mb-4 h-5 w-32' />
              <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className='h-20 rounded-2xl' />
                ))}
              </div>
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-9 w-72 rounded-full' />
              <Skeleton className='h-28 w-full rounded-3xl' />
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-6 w-36' />
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className='aspect-[4/3] w-full rounded-3xl' />
                ))}
              </div>
            </div>
          </div>
          <aside className='space-y-4'>
            <div className='overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800'>
              <Skeleton className='aspect-[16/9] w-full rounded-none' />
              <div className='space-y-2 p-4'>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-40' />
                <Skeleton className='mt-2 h-9 w-full rounded-full' />
              </div>
            </div>
            <div className={cn(SKELETON_PANEL_CLASS, 'hidden space-y-3 lg:block')}>
              <Skeleton className='h-5 w-24' />
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className='flex gap-3'>
                  <Skeleton className='h-14 w-14 shrink-0 rounded-xl' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-3 w-16' />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className='h-28 w-full rounded-3xl' />
          </aside>
        </div>
      </div>
    </div>
  );
}

interface HubPageClientProps {
  posts: GhostPost[];
}

export default function HubPageClient({ posts }: HubPageClientProps) {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { isLoading: isCheckingOnboarding } = useRequireOnboarding();
  const { data: hubData, isLoading: isHubLoading, error: hubError, refetch } = useHubData();
  const canFetchCohostInvites = !isCheckingAuth && !isCheckingOnboarding;
  const { data: directPendingCohostInvites = [] } = useMyCohostInvites(
    'pending',
    canFetchCohostInvites
  );
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    const pathname = '/e/hub';

    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'Evento Hub',
      hideMobileBreadcrumb: true,
      desktopHidden: true,
      subtitle: '',
      leftMode: 'menu',
      showAvatar: true,
      centerMode: 'title',
      buttons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute]);

  if (isCheckingAuth || isCheckingOnboarding || isHubLoading) {
    return <HubPageSkeleton />;
  }

  if (!hubData) {
    return (
      <div className={PAGE_BACKGROUND_CLASS}>
        <div className={PAGE_CONTAINER_CLASS}>
          <div className='rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'>
            <div className='mb-2 flex items-center gap-2 text-base font-semibold'>
              <AlertTriangle className='h-5 w-5' />
              Couldn&apos;t load your hub
            </div>
            <p className='mb-4 text-sm text-amber-800 dark:text-amber-400'>
              {hubError instanceof Error
                ? hubError.message
                : 'Something went wrong while loading your hub data.'}
            </p>
            <Button
              onClick={() => refetch()}
              variant='outline'
              className='rounded-full bg-white dark:bg-neutral-900'
            >
              Try Again
            </Button>
          </div>
          <HubBlogGallery posts={posts} />
        </div>
      </div>
    );
  }

  const { viewer, sections } = hubData;
  const hubPendingCohostInvites = sections.pending_cohost_invites.items;
  const cohostInvites = hubPendingCohostInvites.length
    ? hubPendingCohostInvites
    : directPendingCohostInvites;
  const cohostInvitesError = cohostInvites.length
    ? undefined
    : sections.pending_cohost_invites.error?.message;
  const upNextEvent = sections.my_upcoming_events.items[0] ?? null;
  const isUpNextHost = Boolean(
    viewer &&
    upNextEvent &&
    (upNextEvent.creator_user_id === viewer.id ||
      upNextEvent.hosts?.some((host) => host.id === viewer.id))
  );

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <HubGreeting
          viewer={viewer}
          upcomingEvents={sections.my_upcoming_events.items}
          upcomingTotalCount={sections.my_upcoming_events.total_count}
        />
        <NeedsResponseSection
          cohostInvites={cohostInvites}
          cohostInvitesError={cohostInvitesError}
          eventInvites={sections.pending_event_invites.items}
          eventInvitesTotalCount={sections.pending_event_invites.total_count}
          eventInvitesError={sections.pending_event_invites.error?.message}
        />
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'>
          <div className='min-w-0 space-y-8'>
            <GetStartedCard viewer={viewer} />
            <MyEventsSection
              username={viewer?.username}
              upcomingEvents={sections.my_upcoming_events.items}
              upcomingTotalCount={sections.my_upcoming_events.total_count}
              upcomingHasMore={sections.my_upcoming_events.has_more}
              upcomingError={sections.my_upcoming_events.error}
            />
            <DiscoverSection
              discoverEvents={sections.discover_events.items}
              discoverHasMore={sections.discover_events.has_more}
              discoverTotalCount={sections.discover_events.total_count}
              discoverError={sections.discover_events.error?.message}
            />
            <div className='lg:hidden'>
              <HubBlogGallery posts={posts} />
            </div>
          </div>
          <aside className='space-y-4 lg:sticky lg:top-6 lg:self-start'>
            <UpNextCard event={upNextEvent} isHost={isUpNextHost} />
            <div className='hidden lg:block'>
              <HubBlogRail posts={posts} />
            </div>
            <BuildWithEventoCard />
          </aside>
        </div>
      </div>
    </div>
  );
}
