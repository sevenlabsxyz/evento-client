'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Button } from '@/components/ui/button';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EventRSVP, UserDetails } from '@/lib/types/api';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';

interface GuestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rsvps: EventRSVP[];
}

export default function GuestsSheet({ open, onOpenChange, rsvps }: GuestsSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  const tabItems = useMemo(
    () => [
      { value: 'yes', label: 'Yes' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No' },
    ],
    []
  );

  // Filter by search text first
  const filteredAll = useMemo(() => {
    if (!searchText.trim()) return rsvps;
    const q = searchText.toLowerCase();
    return rsvps.filter((r) => {
      const name = r.user_details?.name?.toLowerCase() || '';
      const username = r.user_details?.username?.toLowerCase() || '';
      const email = r.user_details?.email?.toLowerCase() || '';
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [rsvps, searchText]);

  // Derive per-status lists and counts
  const yesList = useMemo(() => filteredAll.filter((r) => r.status === 'yes'), [filteredAll]);
  const maybeList = useMemo(() => filteredAll.filter((r) => r.status === 'maybe'), [filteredAll]);
  const noList = useMemo(() => filteredAll.filter((r) => r.status === 'no'), [filteredAll]);

  const listForTab = activeTab === 'yes' ? yesList : activeTab === 'maybe' ? maybeList : noList;

  const handleViewProfile = (user: UserDetails | undefined, fallbackUserId?: string) => {
    if (!user) return;

    setSelectedUser({
      ...user,
      id: user.id || fallbackUserId || '',
    });
  };

  return (
    <>
      <SheetWithDetentFull.Root
        presented={open}
        onPresentedChange={(presented) => onOpenChange(presented)}
      >
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='flex flex-col bg-white'>
              {/* Header with search */}
              <div className='px-4 pt-2'>
                <div className='mb-4 flex justify-center'>
                  <SheetWithDetentFull.Handle />
                </div>

                {/* Tabs */}
                <div className='mt-3 px-4'>
                  <SegmentedTabs
                    items={tabItems}
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                  />
                </div>
                <VisuallyHidden.Root asChild>
                  <SheetWithDetentFull.Title>Guest List</SheetWithDetentFull.Title>
                </VisuallyHidden.Root>
                <div className='relative mt-3'>
                  <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
                  <input
                    className='w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-900 outline-none placeholder:text-gray-500'
                    placeholder='Search guests'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              {/* Scrollable content */}
              <div className='min-h-0 flex-1'>
                <SheetWithDetentFull.ScrollRoot asChild>
                  <SheetWithDetentFull.ScrollView className='pb-safe mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain'>
                    <SheetWithDetentFull.ScrollContent>
                      {listForTab.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-16 text-center'>
                          <div className='mb-4 rounded-2xl bg-gray-100 p-4 text-gray-400'>
                            <Search className='h-6 w-6' />
                          </div>
                          <h3 className='mb-1 text-base font-semibold text-gray-900'>
                            {searchText.trim()
                              ? 'No matching guests'
                              : activeTab === 'yes'
                                ? 'No guests marked as Going'
                                : activeTab === 'maybe'
                                  ? 'No guests marked as Maybe'
                                  : 'No guests marked as Not Going'}
                          </h3>
                          <p className='mb-4 max-w-xs text-sm text-gray-500'>
                            {searchText.trim()
                              ? 'Try a different name or username, or clear your search.'
                              : 'Once guests respond, they will appear here.'}
                          </p>
                          {searchText.trim() && (
                            <Button variant='outline' size='sm' onClick={() => setSearchText('')}>
                              Clear search
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className='space-y-3 px-4 pb-6'>
                          {listForTab.map((rsvp, index) => (
                            <button
                              key={rsvp.id ?? `${rsvp.user_id ?? 'guest'}-${rsvp.status}-${index}`}
                              onClick={() => handleViewProfile(rsvp.user_details, rsvp.user_id)}
                              className='flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
                            >
                              <div className='flex flex-1 items-center gap-3'>
                                <UserAvatar
                                  user={{
                                    name: rsvp.user_details?.name || undefined,
                                    username: rsvp.user_details?.username || undefined,
                                    image: rsvp.user_details?.image || undefined,
                                    verification_status:
                                      rsvp.user_details?.verification_status || null,
                                  }}
                                  size='base'
                                />
                                <div className='min-w-0 flex-1'>
                                  <div className='truncate font-medium text-gray-900'>
                                    @{rsvp.user_details?.username || 'guest'}
                                  </div>
                                  <div className='truncate text-sm text-gray-500'>
                                    {rsvp.user_details?.name || 'Guest'}
                                  </div>
                                </div>
                              </div>
                              <CircledIconButton
                                icon={ArrowRight}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProfile(rsvp.user_details, rsvp.user_id);
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </SheetWithDetentFull.ScrollContent>
                  </SheetWithDetentFull.ScrollView>
                </SheetWithDetentFull.ScrollRoot>
              </div>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>

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
