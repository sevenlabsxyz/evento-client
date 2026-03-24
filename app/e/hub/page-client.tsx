'use client';

import { CohostInvitesSection } from '@/components/hub/cohost-invites-section';
import { EventInvitesSection } from '@/components/hub/event-invites-section';
import { ForYouSection } from '@/components/hub/for-you-section';
import { HubBlogGallery } from '@/components/hub/hub-blog-gallery';
import { MyEventsSection } from '@/components/hub/my-events-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useHubData } from '@/lib/hooks/use-hub-data';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';
import { useTopBar } from '@/lib/stores/topbar-store';
import { GhostPost } from '@/lib/types/ghost';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function HubPageSkeleton() {
  return (
    <div className='flex min-h-screen w-full flex-col bg-white'>
      <div className='h-full w-full bg-white px-4 pb-36 pt-4 md:px-8 md:pb-24'>
        <div className='mb-4'>
          <Skeleton className='h-5 w-48' />
        </div>
        <div className='flex flex-col gap-4'>
          <div className='rounded-2xl bg-white p-4'>
            <Skeleton className='mb-3 h-5 w-28' />
            <Skeleton className='h-16 w-full rounded-lg' />
          </div>
          <div className='rounded-2xl bg-white p-4'>
            <Skeleton className='mb-3 h-5 w-36' />
            <Skeleton className='h-16 w-full rounded-lg' />
          </div>
          <div className='rounded-2xl bg-white p-4'>
            <Skeleton className='mb-3 h-5 w-24' />
            <Skeleton className='h-24 w-full rounded-lg' />
          </div>
        </div>
      </div>
    </div>
  );
}

interface HubPageClientProps {
  posts: GhostPost[];
}

export default function HubPageClient({ posts }: HubPageClientProps) {
  const router = useRouter();
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { isLoading: isCheckingOnboarding } = useRequireOnboarding();
  const { data: hubData, isLoading: isHubLoading, error: hubError, refetch } = useHubData();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    const pathname = '/e/hub';

    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'Evento Hub',
      hideMobileBreadcrumb: true,
      subtitle: '',
      leftMode: 'menu',
      showAvatar: true,
      centerMode: 'title',
      buttons: [
        {
          id: 'chat',
          icon: MessageCircle,
          onClick: () => router.push('/e/messages'),
          label: 'Chat',
        },
      ],
      badge: undefined,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, router]);

  if (isCheckingAuth || isCheckingOnboarding || isHubLoading) {
    return <HubPageSkeleton />;
  }

  if (!hubData) {
    return (
      <div className='flex h-full w-full flex-col gap-6 bg-white px-4 pb-44 pt-4 md:px-8 md:pb-32'>
        <div className='rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900'>
          <div className='mb-2 flex items-center gap-2 text-base font-semibold'>
            <AlertTriangle className='h-5 w-5' />
            Couldn&apos;t load your hub
          </div>
          <p className='mb-4 text-sm text-amber-800'>
            {hubError instanceof Error
              ? hubError.message
              : 'Something went wrong while loading your hub data.'}
          </p>
          <Button onClick={() => refetch()} variant='outline' className='rounded-full bg-white'>
            Try Again
          </Button>
        </div>
        <HubBlogGallery posts={posts} />
      </div>
    );
  }

  const { viewer, sections } = hubData;

  return (
    <div className='flex h-full w-full flex-col gap-6 bg-white px-4 pb-44 pt-4 md:px-8 md:pb-32'>
      <CohostInvitesSection
        invites={sections.pending_cohost_invites.items}
        totalCount={sections.pending_cohost_invites.total_count}
        error={sections.pending_cohost_invites.error}
      />
      <div className='flex flex-col gap-6 md:flex-row md:gap-12'>
        <div className='md:w-1/2'>
          <MyEventsSection
            username={viewer?.username}
            upcomingEvents={sections.my_upcoming_events.items}
            upcomingTotalCount={sections.my_upcoming_events.total_count}
            upcomingHasMore={sections.my_upcoming_events.has_more}
            upcomingError={sections.my_upcoming_events.error}
          />
        </div>
        <div className='md:w-1/2'>
          <ForYouSection
            discoverEvents={sections.discover_events.items}
            discoverHasMore={sections.discover_events.has_more}
            discoverTotalCount={sections.discover_events.total_count}
            discoverError={sections.discover_events.error}
          />
        </div>
      </div>
      <EventInvitesSection
        pendingInvites={sections.pending_event_invites.items}
        pendingTotalCount={sections.pending_event_invites.total_count}
        pendingError={sections.pending_event_invites.error}
      />
      <HubBlogGallery posts={posts} />
    </div>
  );
}
