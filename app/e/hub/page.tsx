'use client';

import { CohostInvitesSection } from '@/components/hub/cohost-invites-section';
import { EventInvitesSection } from '@/components/hub/event-invites-section';
import { ForYouSection } from '@/components/hub/for-you-section';
import { HubBlogGallery } from '@/components/hub/hub-blog-gallery';
import { MyEventsSection } from '@/components/hub/my-events-section';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { getOnboardingRedirectUrl, isUserOnboarded } from '@/lib/utils/auth';
import { MessageCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: isCheckingAuth, isAuthenticated, user } = useAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user || !isUserOnboarded(user)) {
      router.push(getOnboardingRedirectUrl(pathname));
      return;
    }
  }, [isCheckingAuth, isAuthenticated, user, pathname, router]);

  // Set TopBar content
  useEffect(() => {
    const pathname = '/e/hub'; // This component is always used for hub

    // Apply any existing configuration for this route
    applyRouteConfig(pathname);

    // Set configuration for this specific route
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

    // Cleanup on unmount
    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, router]);

  if (isCheckingAuth) {
    return (
      <div className='flex min-h-screen w-full flex-col bg-white'>
        <div className='h-full w-full bg-white px-4 pb-36 pt-4 md:px-8 md:pb-24'>
          {/* Welcome text */}
          <div className='mb-4'>
            <Skeleton className='h-5 w-48' />
          </div>
          {/* Sections */}
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

  return (
    <>
      <div className='flex h-full w-full flex-col gap-6 bg-white px-4 pb-44 pt-4 md:px-8 md:pb-32'>
        <CohostInvitesSection />
        <div className='flex flex-col gap-6 md:flex-row md:gap-12'>
          <div className='md:w-1/2'>
            <MyEventsSection />
          </div>
          <div className='md:w-1/2'>
            <ForYouSection />
          </div>
        </div>
        <EventInvitesSection />
        <HubBlogGallery />
      </div>
    </>
  );
}
