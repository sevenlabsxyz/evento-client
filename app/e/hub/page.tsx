'use client';

import { BlogSection } from '@/components/hub/blog-section';
import { EventInvitesSection } from '@/components/hub/event-invites-section';
import { Navbar } from '@/components/navbar';
import RowCard from '@/components/row-card';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { MapPin } from 'lucide-react';
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
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='flex h-full w-full flex-col gap-4 bg-gray-50 px-4 pb-16'>
        <div className='pt-4 text-left text-base text-gray-500'>
          Welcome back @{user?.username},
        </div>
        <div className='flex flex-col gap-4'>
          <RowCard title='Travel Itinerary' icon={<MapPin />} isClickable />
          <EventInvitesSection />
          <BlogSection />
        </div>
      </div>
      <Navbar />
    </>
  );
}
