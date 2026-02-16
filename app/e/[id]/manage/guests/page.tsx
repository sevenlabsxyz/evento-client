'use client';

import { exportGuestsCsvAction } from '@/app/actions/export-guests';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useRemoveGuest } from '@/lib/hooks/use-remove-guest';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventRSVP, RSVPStatus, UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Loader2, Search, Share2, Users, X } from 'lucide-react';
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
  const guests = rsvps && rsvps.length ? rsvps : [];
  const creatorId = existingEvent?.creator_user_id;
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState<RSVPStatus>('yes');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestToRemove, setGuestToRemove] = useState<EventRSVP | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const removeGuest = useRemoveGuest();

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

  const cohostIds = useMemo(() => {
    const ids = new Set<string>();
    (existingEvent?.hosts || []).forEach((host) => {
      if (host.id) ids.add(host.id);
    });
    return ids;
  }, [existingEvent?.hosts]);

  const getGuestRole = (userId: string) => {
    if (creatorId && userId === creatorId) return 'creator' as const;
    if (cohostIds.has(userId)) return 'cohost' as const;
    return null;
  };

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
          id: 'export',
          icon: Share2,
          onClick: () => handleExportCSV(),
          label: 'Export CSV',
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
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
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

  const handleOpenRemoveSheet = (guest: EventRSVP) => {
    setGuestToRemove(guest);
  };

  const handleCloseRemoveSheet = () => {
    if (removeGuest.isPending) return;
    setGuestToRemove(null);
  };

  const handleConfirmRemoveGuest = async () => {
    if (!guestToRemove) return;

    setRemovingUserId(guestToRemove.user_id);

    try {
      await removeGuest.mutateAsync({
        eventId,
        userId: guestToRemove.user_id,
      });
      toast.success('Guest removed from guest list');
      setGuestToRemove(null);
    } catch {
      toast.error('Failed to remove guest');
    } finally {
      setRemovingUserId(null);
    }
  };

  const segmentedTabItems = tabs.map((tab) => ({
    value: tab.key,
    label: (
      <>
        {tab.label}
        {tab.count > 0 && <span className='ml-1 text-xs opacity-70'>({tab.count})</span>}
      </>
    ),
  }));

  return (
    <>
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        {/* Search Bar */}
        <div className='p-4 pb-0'>
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
        <SegmentedTabs
          items={segmentedTabItems}
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as RSVPStatus)}
        />

        {activeTab === 'yes' && (
          <div className='px-4'>
            <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700'>
              Creator and co-hosts cannot be removed from this list. Remove co-host access in Hosts
              to remove them from the guest list.
            </div>
          </div>
        )}

        {/* Content */}
        <div className='flex-1 p-4'>
          {filteredGuests.length > 0 ? (
            <div className='space-y-3'>
              {filteredGuests.map((guest) => {
                const guestRole = getGuestRole(guest.user_id);

                return (
                  <div
                    key={guest.id}
                    className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'
                  >
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
                    {activeTab === 'yes' && !guestRole && (
                      <button
                        onClick={() => handleOpenRemoveSheet(guest)}
                        disabled={removingUserId === guest.user_id}
                        className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 disabled:opacity-50'
                        aria-label={`Remove ${guest.user_details?.name || guest.user_details?.username || 'guest'}`}
                      >
                        {removingUserId === guest.user_id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          <X className='h-4 w-4' />
                        )}
                      </button>
                    )}
                    {activeTab === 'yes' && guestRole && (
                      <div className='flex flex-col items-end gap-1'>
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'>
                          {guestRole === 'creator' ? 'Creator' : 'Co-host'}
                        </span>
                        <span className='text-[11px] text-gray-500'>Manage in Hosts</span>
                      </div>
                    )}
                  </div>
                );
              })}
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
        <div className='mt-auto border-t border-gray-100 bg-gray-50 p-4'>
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

      <DetachedSheet.Root
        presented={!!guestToRemove}
        onPresentedChange={(presented) => !presented && handleCloseRemoveSheet()}
      >
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='p-6'>
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>

                <h2 className='mb-2 text-xl font-semibold text-gray-900'>Remove guest?</h2>
                <p className='mb-6 text-sm text-gray-600'>
                  Remove{' '}
                  <span className='font-medium text-gray-900'>
                    {guestToRemove?.user_details?.name ||
                      guestToRemove?.user_details?.username ||
                      'this user'}
                  </span>{' '}
                  from the approved guest list? They will lose guest-list access.
                </p>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <button
                    onClick={handleCloseRemoveSheet}
                    disabled={removeGuest.isPending}
                    className='w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRemoveGuest}
                    disabled={removeGuest.isPending}
                    className='w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50'
                  >
                    {removeGuest.isPending ? 'Removing...' : 'Remove guest'}
                  </button>
                </div>
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>
    </>
  );
}
