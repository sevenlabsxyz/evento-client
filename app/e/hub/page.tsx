'use client';

import { BlogSection } from '@/components/hub/blog-section';
import { EventInvitesSection } from '@/components/hub/event-invites-section';
import { MyEventsSection } from '@/components/hub/my-events-section';
import { Navbar } from '@/components/navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useEffect } from 'react';

export default function HubPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { isLoading: isCheckingOnboarding } = useRequireOnboarding();
  const { user } = useUserProfile();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  // Set TopBar content
  useEffect(() => {
    const pathname = '/e/hub'; // This component is always used for hub

    // Apply any existing configuration for this route
    applyRouteConfig(pathname);

    // Set configuration for this specific route
    setTopBarForRoute(pathname, {
      title: 'Hub',
      subtitle: '',
      leftMode: 'menu',
      showAvatar: true,
      centerMode: 'title',
      buttons: [],
    });

    // Cleanup on unmount
    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute]);

  if (isCheckingAuth || isCheckingOnboarding) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='mx-auto h-full w-full max-w-full bg-gray-50 px-4 pb-16 pt-4 md:max-w-sm'>
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
        <Navbar />
      </div>
    );
  }

  return (
    <>
      <div className='mx-auto flex h-full w-full flex-col gap-4 bg-gray-50 px-4 pb-16 md:max-w-sm'>
        <div className='pt-4 text-left text-base text-gray-500'>
          Welcome back @{user?.username},
        </div>
        <div className='flex flex-col gap-4'>
          <MyEventsSection />
          <EventInvitesSection />
          <BlogSection />
        </div>
      </div>
      <Navbar />
    </>
  );
}
