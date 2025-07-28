'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useRequireOnboarding } from '@/lib/hooks/useRequireOnboarding';
import TravelItinerary from '../../../travel-itinerary';
import RowCard from '@/components/row-card';
import { Calendar1, MapPin } from 'lucide-react';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useEffect } from 'react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { Navbar } from '@/components/navbar';

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
      <div className='flex flex-col px-4 gap-4 bg-gray-50 h-full w-full'>
        <div className='text-base text-left pt-4 text-gray-500'>
          Welcome back @{user?.username},
        </div>
        <div className='flex flex-col gap-4'>
          <RowCard title='Travel Itinerary' icon={<MapPin />} isClickable />
          <RowCard
            title='Event Invites'
            subtitle='View your current invites'
            icon={<Calendar1 />}
            isClickable
          />
        </div>
      </div>
      <Navbar />
    </>
  );
}
