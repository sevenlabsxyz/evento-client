import { AlertTriangle, Archive, Calendar, Check, Clock } from '@/components/icons/lucide';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useEventInvites } from '@/lib/hooks/use-event-invites';
import { EventInvite, HubSectionError } from '@/lib/types/api';
import { VisuallyHidden } from '@silk-hq/components';
import { useEffect, useState } from 'react';
import { SheetWithDetentFull } from '../ui/sheet-with-detent-full';
import { MasterInviteCard } from './master-invite-card';

interface EventInvitesSheetProps {
  showInvitesSheet: boolean;
  setShowInvitesSheet: (show: boolean) => void;
  handleRSVP: (eventId: string) => void;
  pendingInvites: EventInvite[];
  pendingTotalCount?: number | null;
  pendingError?: HubSectionError;
}

export function EventInvitesSheet({
  showInvitesSheet,
  setShowInvitesSheet,
  handleRSVP,
  pendingInvites,
  pendingTotalCount,
  pendingError,
}: EventInvitesSheetProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'responded'>('pending');
  const [loadedTabs, setLoadedTabs] = useState<Set<'pending' | 'responded'>>(new Set());

  // Only load data for tabs that have been opened
  const {
    data: fullPendingInvites,
    isLoading: isLoadingPending,
    error: pendingFetchError,
  } = useEventInvites('pending', showInvitesSheet && loadedTabs.has('pending'));
  const { data: respondedInvites = [], isLoading: isLoadingResponded } = useEventInvites(
    'responded',
    loadedTabs.has('responded')
  );

  const pendingSheetInvites = fullPendingInvites ?? pendingInvites;
  const shouldShowPendingLoading = isLoadingPending && !fullPendingInvites;
  const pendingSheetError =
    pendingFetchError && pendingInvites.length === 0
      ? { message: pendingFetchError.message }
      : pendingError;

  // Track when tabs are opened for lazy loading
  useEffect(() => {
    if (showInvitesSheet && !loadedTabs.has(activeTab)) {
      setLoadedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, showInvitesSheet, loadedTabs]);

  // Reset loaded tabs when sheet closes
  useEffect(() => {
    if (!showInvitesSheet) {
      setLoadedTabs(new Set());
    }
  }, [showInvitesSheet]);

  return (
    <SheetWithDetentFull.Root
      presented={showInvitesSheet}
      onPresentedChange={(presented) => !presented && setShowInvitesSheet(false)}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='flex flex-col bg-white'>
            <div className='px-4 pt-2'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>

              <VisuallyHidden.Root asChild>
                <SheetWithDetentFull.Title>Event Invites</SheetWithDetentFull.Title>
              </VisuallyHidden.Root>

              {/* Tabs */}
              <AnimatedTabs
                tabs={[
                  {
                    title: `Waiting (${pendingTotalCount ?? pendingInvites.length})`,
                    icon: Clock,
                    onClick: () => setActiveTab('pending'),
                  },
                  { title: 'Archive', icon: Archive, onClick: () => setActiveTab('responded') },
                ]}
                selected={['pending', 'responded'].indexOf(activeTab)}
                className='mb-4'
              />
            </div>

            {/* Scrollable content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='pb-safe flex-1 overflow-y-auto'>
                <SheetWithDetentFull.ScrollContent>
                  <div className='px-4 pb-6'>
                    {activeTab === 'pending' ? (
                      shouldShowPendingLoading ? (
                        <div className='space-y-4'>
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className='h-32 animate-pulse rounded-2xl bg-gray-100' />
                          ))}
                        </div>
                      ) : pendingSheetError ? (
                        <Empty className='py-16'>
                          <EmptyHeader>
                            <EmptyMedia variant='soft-square'>
                              <AlertTriangle className='h-8 w-8' />
                            </EmptyMedia>
                            <EmptyTitle className='text-base sm:text-base'>
                              Couldn&apos;t load pending invites
                            </EmptyTitle>
                            <EmptyDescription>{pendingSheetError.message}</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : pendingSheetInvites.length === 0 ? (
                        <Empty className='py-16'>
                          <EmptyHeader>
                            <EmptyMedia variant='soft-square'>
                              <Calendar className='h-8 w-8' />
                            </EmptyMedia>
                            <EmptyTitle className='text-base sm:text-base'>
                              No pending invites
                            </EmptyTitle>
                            <EmptyDescription>You&apos;re all caught up!</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <div className='space-y-4'>
                          {pendingSheetInvites.map((invite: EventInvite) => (
                            <MasterInviteCard
                              key={invite.id}
                              invite={invite}
                              onRSVP={() => handleRSVP(invite.event_id)}
                            />
                          ))}
                        </div>
                      )
                    ) : // Responded tab
                    isLoadingResponded ? (
                      <div className='space-y-4'>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className='h-32 animate-pulse rounded-2xl bg-gray-100' />
                        ))}
                      </div>
                    ) : respondedInvites.length === 0 ? (
                      <Empty className='py-16'>
                        <EmptyHeader>
                          <EmptyMedia variant='soft-square'>
                            <Check className='h-8 w-8' />
                          </EmptyMedia>
                          <EmptyTitle className='text-base sm:text-base'>
                            No responded invites
                          </EmptyTitle>
                          <EmptyDescription>
                            Invites you respond to will appear here
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className='space-y-4'>
                        {respondedInvites.map((invite: EventInvite) => (
                          <MasterInviteCard
                            key={invite.id}
                            invite={invite}
                            onRSVP={() => handleRSVP(invite.event_id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
