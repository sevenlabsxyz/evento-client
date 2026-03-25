'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { BatchZapSheet } from '@/components/zap/batch-zap-sheet';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWallet } from '@/lib/hooks/use-wallet';
import { breezSDK } from '@/lib/services/breez-sdk';
import { EventRSVP, UserDetails } from '@/lib/types/api';
import { buildBatchZapRecipients } from '@/lib/utils/batch-zap';
import { redirectToWalletUnlock, showWalletUnlockToast } from '@/lib/utils/wallet-unlock-toast';
import { ArrowRight, Check, CircleHelp, Search, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';

interface GuestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rsvps: EventRSVP[];
  eventCreatorUserId: string;
  hostUserIds: string[];
  currentUserId?: string;
}

export default function GuestsSheet({
  open,
  onOpenChange,
  rsvps,
  eventCreatorUserId,
  hostUserIds,
  currentUserId,
}: GuestsSheetProps) {
  const router = useRouter();
  const { user: loggedInUser } = useAuth();
  const { walletState, isLoading: isWalletLoading } = useWallet();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isBatchZapOpen, setIsBatchZapOpen] = useState(false);

  const isViewerHost = useMemo(() => {
    if (!currentUserId) return false;
    if (currentUserId === eventCreatorUserId) return true;
    return hostUserIds.includes(currentUserId);
  }, [currentUserId, eventCreatorUserId, hostUserIds]);

  const batchRecipientSummary = useMemo(
    () =>
      buildBatchZapRecipients({
        rsvps,
        creatorUserId: eventCreatorUserId,
        hostUserIds,
        currentUserId,
        isViewerHost,
      }),
    [rsvps, eventCreatorUserId, hostUserIds, currentUserId, isViewerHost]
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

  const handleOpenBatchZap = () => {
    if (isWalletLoading) {
      return;
    }

    if (!walletState.isConnected || !breezSDK.isConnected()) {
      showWalletUnlockToast(() =>
        redirectToWalletUnlock(router, { rememberBatchZapReturnPath: true })
      );
      return;
    }

    setIsBatchZapOpen(true);
  };

  return (
    <>
      <MasterScrollableSheet
        title='Guest List'
        open={open}
        onOpenChange={onOpenChange}
        headerSecondary={
          <div className='space-y-3 px-4 pb-2'>
            <AnimatedTabs
              expanded
              className='w-full [&>button]:flex-1 [&>button]:justify-center'
              tabs={[
                { title: 'Yes', icon: Check, onClick: () => setActiveTab('yes') },
                { title: 'Maybe', icon: CircleHelp, onClick: () => setActiveTab('maybe') },
                { title: 'No', icon: X, onClick: () => setActiveTab('no') },
              ]}
              selected={['yes', 'maybe', 'no'].indexOf(activeTab)}
            />

            <div className='flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
                <input
                  className='w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-gray-900 outline-none placeholder:text-gray-500'
                  placeholder='Search guests'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <Button
                variant='outline'
                size='sm'
                className='h-12 rounded-full border-gray-200 bg-gray-50 px-4'
                disabled={batchRecipientSummary.eligibleRecipients.length === 0}
                onClick={handleOpenBatchZap}
              >
                <Zap className='h-4 w-4' />
                Zap All
              </Button>
            </div>
          </div>
        }
        contentClassName='px-4 pb-6 pt-4'
      >
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
          <div className='space-y-3'>
            {listForTab.map((rsvp, index) => (
              <div
                key={rsvp.id ?? `${rsvp.user_id ?? 'guest'}-${rsvp.status}-${index}`}
                className='flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100'
              >
                <button
                  type='button'
                  onClick={() => handleViewProfile(rsvp.user_details, rsvp.user_id)}
                  className='flex min-w-0 flex-1 items-center gap-3 text-left'
                  aria-label={`Open profile for @${
                    rsvp.user_details?.username || rsvp.user_details?.name || 'guest'
                  }`}
                >
                  <UserAvatar
                    user={{
                      name: rsvp.user_details?.name || undefined,
                      username: rsvp.user_details?.username || undefined,
                      image: rsvp.user_details?.image || undefined,
                      verification_status: rsvp.user_details?.verification_status || null,
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
                </button>
                <div className='flex shrink-0 items-center gap-2'>
                  {rsvp.user_details?.username !== loggedInUser?.username && (
                    <ZapSheet
                      recipientLightningAddress={rsvp.user_details?.ln_address || ''}
                      recipientName={
                        rsvp.user_details?.name || rsvp.user_details?.username || 'Guest'
                      }
                      recipientUsername={rsvp.user_details?.username || undefined}
                      recipientAvatar={rsvp.user_details?.image || undefined}
                      currentUsername={loggedInUser?.username}
                    >
                      <CircledIconButton icon={Zap} />
                    </ZapSheet>
                  )}
                  <CircledIconButton
                    icon={ArrowRight}
                    onClick={() => {
                      handleViewProfile(rsvp.user_details, rsvp.user_id);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </MasterScrollableSheet>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}

      <BatchZapSheet
        open={isBatchZapOpen}
        onOpenChange={setIsBatchZapOpen}
        recipientSummary={batchRecipientSummary}
      />
    </>
  );
}
