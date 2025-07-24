'use client';

import { Navbar } from '@/components/navbar';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Inbox } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'Inbox',
      subtitle: undefined,
      showAvatar: true,
      leftMode: 'menu',
      centerMode: 'title',
    });

    // Cleanup function to reset topbar state when leaving this page
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, applyRouteConfig, setTopBarForRoute, clearRoute]);

  const [activeTab, setActiveTab] = useState('notifications');

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Coming Soon Content */}
      <div className='flex flex-1 flex-col items-center justify-center px-4 pb-20'>
        <div className='flex flex-col items-center text-center'>
          <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100'>
            <Inbox className='h-10 w-10 text-gray-400' />
          </div>
          <h2 className='mb-3 text-xl font-semibold text-gray-900'>Coming Soon</h2>
          <p className='max-w-sm text-gray-600'>
            Notification functionality is coming soon. Stay tuned for updates on likes, comments,
            and activity!
          </p>
        </div>
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
