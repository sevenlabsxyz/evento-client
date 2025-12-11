'use client';

import { exportGuestsCsvAction } from '@/app/actions/export-guests';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useTopBar } from '@/lib/stores/topbar-store';
import { RSVPStatus, UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { MoreHorizontal, Search, Users } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function GuestListPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);
  const { data: rsvps } = useEventRSVPs(eventId);
  const guests = useMemo(() => (rsvps && rsvps.length ? rsvps : []), [rsvps]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState<RSVPStatus>('yes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hideGuestList, setHideGuestList] = useState(!existingEvent?.guestListSettings?.isPublic);

  // Filter guests based on active tab and search query
  const filteredGuests = useMemo(
    () =>
      guests.filter((guest) => {
        const matchesTab = guest.status === activeTab;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchesTab;
        const name = (guest.user_details?.name || '').toLowerCase();
        const email = (guest.user_details?.email || '').toLowerCase();
        const username = (guest.user_details?.username || '').toLowerCase();
        return matchesTab && (name.includes(q) || email.includes(q) || username.includes(q));
      }),
    [guests, activeTab, searchQuery]
  );

  // Configure TopBar for this route
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Guest List',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'more',
          icon: MoreHorizontal,
          onClick: () => setShowMoreMenu((v) => !v),
          label: 'More',
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, pathname, setTopBarForRoute]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          {/* Search bar skeleton */}
          <Skeleton className='h-12 w-full rounded-xl' />

          {/* Tabs skeleton */}
          <div className='flex space-x-1'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-20 rounded-lg' />
            ))}
          </div>

          {/* Guest list skeleton */}
          <div className='space-y-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
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

  // Calculate counts for each status
  const getGuestCount = (status: RSVPStatus) =>
    guests.filter((guest) => guest.status === status).length;

  const tabs = [
    { key: 'yes' as const, label: 'Going', count: getGuestCount('yes') },
    {
      key: 'no' as const,
      label: 'Not Going',
      count: getGuestCount('no'),
    },
    { key: 'maybe' as const, label: 'Maybe', count: getGuestCount('maybe') },
  ];

  const handleTabChange = (tab: RSVPStatus) => {
    setActiveTab(tab);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleToggleHideGuestList = () => {
    setHideGuestList(!hideGuestList);
  };

  const handleExportCSV = async () => {
    if (!existingEvent || !guests.length) {
      toast.error('No guest data available to export');
      return;
    }

    toast.info('Exporting guest list...');

    try {
      const { filename, csv } = await exportGuestsCsvAction({
        guests,
        eventTitle: existingEvent.title,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Guest list exported successfully');
    } catch {
      toast.error('Failed to export guest list. Please try again');
    }
  };

  return (
    <>
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <DropdownMenu open={showMoreMenu} onOpenChange={setShowMoreMenu}>
          {/* Hidden, fixed-position trigger to anchor the menu near the TopBar ellipsis */}
          <div className='fixed right-3 top-5 z-50'>
            <DropdownMenuTrigger asChild>
              <button aria-label='More' className='m-0 h-0 w-0 p-0 opacity-0' />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent side='bottom' align='end' sideOffset={8} className='min-w-56'>
            <DropdownMenuItem onClick={handleExportCSV} className='font-medium'>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={hideGuestList}
              onCheckedChange={() => handleToggleHideGuestList()}
            >
              Hide guest list
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Bar */}
        <div className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
            <input
              type='text'
              placeholder='Search event guests...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none'
            />
          </div>
        </div>

        {/* Tabs */}
        <div className='px-4'>
          <div className='flex space-x-1 overflow-x-auto pb-2'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-shrink-0 rounded-lg px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && <span className='ml-1 text-xs'>({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 p-4'>
          {filteredGuests.length > 0 ? (
            <div className='space-y-3'>
              {filteredGuests.map((guest) => (
                <div key={guest.id} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
                  <UserAvatar
                    user={{
                      name: guest.user_details?.name,
                      username: guest.user_details?.username,
                      image: guest.user_details?.image,
                      verification_status: guest.user_details?.verification_status,
                    }}
                    onAvatarClick={() => setSelectedUser(guest?.user_details || null)}
                    height={48}
                    width={48}
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900'>{guest.user_details?.name}</h3>
                    <p className='text-sm text-gray-500'>{guest.user_details?.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-16 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Users className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>No Guests</h3>
              <p className='text-sm text-gray-500'>
                {activeTab === 'yes' && "No guests have confirmed they're going yet."}
                {activeTab === 'no' && 'No guests have declined yet.'}
                {activeTab === 'maybe' && 'No guests have responded with maybe yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className='border-t border-gray-100 bg-gray-50 p-4'>
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <span>Total Guests: {guests.length}</span>
            <span>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}:{' '}
              {filteredGuests.length}
            </span>
          </div>
        </div>
      </div>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </>
  );
}
