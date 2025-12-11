'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Mail, Plus } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HostsManagementPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);

  // Mock co-hosts data (empty for now)
  const [coHosts, setCoHosts] = useState<any[]>([]);

  const handleAddCoHost = () => {
    // TODO: Implement add co-host functionality
    console.log('Add co-host clicked');
    // This would typically open a modal or navigate to an invite screen
  };

  const handleInviteCoHost = (email: string) => {
    // TODO: Implement invite co-host functionality
    console.log('Inviting co-host:', email);
  };

  // Configure TopBar for this page
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Hosts',
      leftMode: 'back',
      showAvatar: false,
      subtitle: '',
      centerMode: 'title',
      buttons: [
        {
          id: 'add-cohost',
          icon: Plus,
          onClick: handleAddCoHost,
          label: 'Add Co-host',
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, pathname, applyRouteConfig]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          {/* Event Creator Skeleton */}
          <div className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-5 w-16 rounded-full' />
              </div>
              <Skeleton className='h-4 w-32' />
            </div>
          </div>

          {/* Co-hosts Section Skeleton */}
          <div className='space-y-3'>
            <Skeleton className='h-6 w-20' />
            {[1, 2].map((i) => (
              <div
                key={i}
                className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4'
              >
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-5 w-28' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                  <Skeleton className='h-4 w-36' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to manage doesn&apos;t exist.
          </p>
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

  // Mock data for current user (event creator)
  const currentUser = {
    id: 'current-user-id',
    name: 'Andre Neves',
    email: 'andrerfneves@protonmail.com',
    avatar: '/api/placeholder/40/40',
    role: 'Creator',
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='space-y-4 p-4'>
        {/* Event Creator */}
        <div className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-500'>
            <span className='text-lg font-semibold text-white'>
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-gray-900'>{currentUser.name}</h3>
              <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700'>
                {currentUser.role}
              </span>
            </div>
            <div className='flex items-center gap-1 text-sm text-gray-500'>
              <Mail className='h-3 w-3' />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Co-hosts Section */}
        {coHosts.length > 0 ? (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-gray-900'>Co-hosts</h3>
            {coHosts.map((coHost) => (
              <div
                key={coHost.id}
                className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-300'>
                  <span className='text-lg font-semibold text-gray-600'>
                    {coHost.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-semibold text-gray-900'>{coHost.name}</h3>
                    <span className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700'>
                      Co-host
                    </span>
                  </div>
                  <div className='flex items-center gap-1 text-sm text-gray-500'>
                    <Mail className='h-3 w-3' />
                    <span>{coHost.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Plus className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>No Co-hosts</h3>
            <p className='mb-6 text-sm text-gray-500'>Add co-hosts to help you manage this event</p>
            <button
              onClick={handleAddCoHost}
              className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600'
            >
              Add Co-host
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
