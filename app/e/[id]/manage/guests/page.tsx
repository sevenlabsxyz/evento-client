'use client';

import { exportGuestsCsvAction } from '@/app/actions/export-guests';
import { GuestSummaryChips } from '@/components/manage-dashboard/guests/guest-summary-chips';
import { InvitedGuestsList } from '@/components/manage-dashboard/guests/invited-guests-list';
import {
  RsvpGuestList,
  type GuestRole,
} from '@/components/manage-dashboard/guests/rsvp-guest-list';
import InviteUsersSheet from '@/components/manage-event/invite-users-sheet';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { BatchZapSheet } from '@/components/zap/batch-zap-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useRemoveGuest } from '@/lib/hooks/use-remove-guest';
import { useWallet } from '@/lib/hooks/use-wallet';
import { queryKeys } from '@/lib/query-client';
import { breezSDK } from '@/lib/services/breez-sdk';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventRSVP, RSVPStatus, UserDetails } from '@/lib/types/api';
import { buildBatchZapRecipients } from '@/lib/utils/batch-zap';
import { toast } from '@/lib/utils/toast';
import { redirectToWalletUnlock, showWalletUnlockToast } from '@/lib/utils/wallet-unlock-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  CircleHelp,
  Download,
  Mail,
  Search,
  Share2,
  UserPlus,
  XCircle,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type GuestTab = RSVPStatus | 'invited';

const GUEST_TABS: GuestTab[] = ['yes', 'maybe', 'no', 'invited'];

const RSVP_TAB_LABEL_KEYS = {
  yes: 'going',
  maybe: 'maybe',
  no: 'notGoing',
} as const satisfies Record<RSVPStatus, string>;

function parseGuestTab(value: string | null): GuestTab {
  return GUEST_TABS.find((tab) => tab === value) ?? 'yes';
}

export default function GuestListPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { walletState, isLoading: isWalletLoading } = useWallet();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);
  const { data: rsvps, isLoading: isRsvpsLoading } = useEventRSVPs(eventId);
  const { data: dashboard, isLoading: isDashboardLoading } = useEventDashboard(eventId);
  const guests = useMemo(() => (rsvps && rsvps.length ? rsvps : []), [rsvps]);
  const creatorId = existingEvent?.creator_user_id;
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<GuestTab>(() => parseGuestTab(tabParam));
  const [searchQuery, setSearchQuery] = useState('');
  const [guestToRemove, setGuestToRemove] = useState<EventRSVP | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [isBatchZapOpen, setIsBatchZapOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const removeGuest = useRemoveGuest();

  // Keep the selected tab in sync with `?tab=` (deep links from the overview)
  useEffect(() => {
    setActiveTab(parseGuestTab(tabParam));
  }, [tabParam]);

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

  const getGuestRole = (userId: string): GuestRole => {
    if (creatorId && userId === creatorId) return 'creator';
    if (cohostIds.has(userId)) return 'cohost';
    return null;
  };

  const batchRecipientSummary = useMemo(
    () =>
      buildBatchZapRecipients({
        rsvps: guests,
        creatorUserId: creatorId,
        hostUserIds: Array.from(cohostIds),
        currentUserId: user?.id,
        isViewerHost: true,
      }),
    [guests, creatorId, cohostIds, user?.id]
  );

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

  const handleExportCSV = async () => {
    if (!existingEvent || !guests.length) {
      toast.error(t('guests.toasts.noDataToExport'));
      return;
    }

    toast.info(t('guests.toasts.exporting'));

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
      toast.success(t('guests.toasts.exported'));
    } catch {
      toast.error(t('guests.toasts.exportFailed'));
    }
  };

  // The top bar button is registered once; route it to the latest export handler
  const exportCsvRef = useRef(handleExportCSV);
  useEffect(() => {
    exportCsvRef.current = handleExportCSV;
  });

  // Configure TopBar for this route
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('guests.topBarTitle'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [
        {
          id: 'export',
          icon: Share2,
          onClick: () => void exportCsvRef.current(),
          label: t('guests.exportCsv'),
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, eventId, pathname, router, setTopBarForRoute, t]);

  if (isLoading) {
    return <GuestListSkeleton />;
  }

  if (error || !existingEvent) {
    return (
      <div className='py-4 md:py-6'>
        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <h2 className='mb-2 text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('guests.notFound.title')}
          </h2>
          <p className='mb-4 text-sm text-gray-600 dark:text-neutral-400'>
            {t('guests.notFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {tCommon('actions.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // Calculate counts for each status
  const getGuestCount = (status: RSVPStatus) =>
    guests.filter((guest) => guest.status === status).length;

  const handleTabChange = (tab: GuestTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === 'yes') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    const query = nextParams.toString();
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
      toast.success(t('guests.toasts.removed'));
      setGuestToRemove(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
    } catch {
      toast.error(t('guests.toasts.removeFailed'));
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleCloseInvite = () => {
    setIsInviteOpen(false);
    queryClient.invalidateQueries({ queryKey: [...queryKeys.event(eventId), 'invites'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
  };

  const invitedCount = dashboard?.invites.total;

  return (
    <>
      <div className='space-y-4 py-4 md:py-6'>
        {/* Page intro */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
              {t('guests.heading')}
            </h2>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('guests.subheading')}</p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Button type='button' size='sm' onClick={() => setIsInviteOpen(true)}>
              <UserPlus />
              {t('guests.inviteGuests')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
              disabled={batchRecipientSummary.eligibleRecipients.length === 0}
              onClick={handleOpenBatchZap}
            >
              <Zap className='h-4 w-4' />
              {t('guests.zapAll')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
              onClick={() => void handleExportCSV()}
            >
              <Download className='h-4 w-4' />
              {t('guests.exportCsv')}
            </Button>
          </div>
        </div>

        <GuestSummaryChips dashboard={dashboard} isLoading={isDashboardLoading} />

        {/* Tabs */}
        <div className='-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0'>
          <AnimatedTabs
            expanded
            tabs={[
              {
                title: t('guests.tabs.withCount', {
                  label: t(`guests.tabs.${RSVP_TAB_LABEL_KEYS.yes}`),
                  count: getGuestCount('yes'),
                }),
                icon: CheckCircle,
                onClick: () => handleTabChange('yes'),
              },
              {
                title: t('guests.tabs.withCount', {
                  label: t(`guests.tabs.${RSVP_TAB_LABEL_KEYS.maybe}`),
                  count: getGuestCount('maybe'),
                }),
                icon: CircleHelp,
                onClick: () => handleTabChange('maybe'),
              },
              {
                title: t('guests.tabs.withCount', {
                  label: t(`guests.tabs.${RSVP_TAB_LABEL_KEYS.no}`),
                  count: getGuestCount('no'),
                }),
                icon: XCircle,
                onClick: () => handleTabChange('no'),
              },
              {
                title:
                  invitedCount === undefined
                    ? t('guests.tabs.invited')
                    : t('guests.tabs.withCount', {
                        label: t('guests.tabs.invited'),
                        count: invitedCount,
                      }),
                icon: Mail,
                onClick: () => handleTabChange('invited'),
              },
            ]}
            selected={GUEST_TABS.indexOf(activeTab)}
          />
        </div>

        {activeTab === 'invited' ? (
          <InvitedGuestsList
            eventId={eventId}
            counts={dashboard?.invites}
            onInvite={() => setIsInviteOpen(true)}
          />
        ) : (
          <>
            {/* Search Bar */}
            <div className='relative md:max-w-md'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 dark:text-neutral-400' />
              <input
                type='text'
                placeholder={t('guests.searchPlaceholder')}
                aria-label={t('guests.searchLabel')}
                value={searchQuery}
                onChange={handleSearchChange}
                className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400'
              />
            </div>

            {activeTab === 'yes' && (
              <div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'>
                {t('guests.hostsNotice')}
              </div>
            )}

            {isRsvpsLoading ? (
              <GuestRowsSkeleton />
            ) : (
              <RsvpGuestList
                eventId={eventId}
                guests={filteredGuests}
                activeTab={activeTab}
                hasSearchQuery={searchQuery.trim().length > 0}
                removingUserId={removingUserId}
                getGuestRole={getGuestRole}
                onRemove={handleOpenRemoveSheet}
                onSelectUser={setSelectedUser}
              />
            )}

            {/* Summary Footer */}
            <div className='flex items-center justify-between text-sm text-gray-600 dark:text-neutral-400'>
              <span>{t('guests.footer.total', { count: guests.length })}</span>
              <span>
                {t('guests.footer.statusCount', {
                  label: t(`guests.tabs.${RSVP_TAB_LABEL_KEYS[activeTab]}`),
                  count: filteredGuests.length,
                })}
              </span>
            </div>
          </>
        )}
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

                <h2 className='mb-2 text-xl font-semibold text-gray-900 dark:text-neutral-100'>
                  {t('guests.removeSheet.title')}
                </h2>
                <p className='mb-6 text-sm text-gray-600 dark:text-neutral-400'>
                  {t.rich('guests.removeSheet.description', {
                    name:
                      guestToRemove?.user_details?.name ||
                      guestToRemove?.user_details?.username ||
                      t('guests.removeSheet.thisUser'),
                    strong: (chunks) => (
                      <span className='font-medium text-gray-900 dark:text-neutral-100'>
                        {chunks}
                      </span>
                    ),
                  })}
                </p>

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <button
                    onClick={handleCloseRemoveSheet}
                    disabled={removeGuest.isPending}
                    className='w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-950'
                  >
                    {tCommon('actions.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmRemoveGuest}
                    disabled={removeGuest.isPending}
                    className='w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700'
                  >
                    {removeGuest.isPending
                      ? t('guests.removeSheet.removing')
                      : t('guests.removeSheet.confirm')}
                  </button>
                </div>
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>

      <BatchZapSheet
        open={isBatchZapOpen}
        onOpenChange={setIsBatchZapOpen}
        recipientSummary={batchRecipientSummary}
      />

      {isInviteOpen && (
        <InviteUsersSheet eventId={eventId} isOpen={isInviteOpen} onClose={handleCloseInvite} />
      )}
    </>
  );
}

function GuestRowsSkeleton() {
  const t = useTranslations('manageLegacy');
  return (
    <div className='space-y-3' aria-busy='true' aria-label={t('guests.loadingGuests')}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-900'
        >
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
      ))}
    </div>
  );
}

function GuestListSkeleton() {
  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div className='space-y-2'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-[60px] w-full rounded-2xl' />
        ))}
      </div>
      <div className='flex gap-1'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-10 w-24 rounded-full' />
        ))}
      </div>
      <Skeleton className='h-12 w-full rounded-xl md:max-w-md' />
      <GuestRowsSkeleton />
    </div>
  );
}
