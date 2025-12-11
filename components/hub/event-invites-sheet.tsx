import SegmentedTabs from '@/components/ui/segmented-tabs';
import { useEventInvites } from '@/lib/hooks/use-event-invites';
import { EventInvite } from '@/lib/types/api';
import { VisuallyHidden } from '@silk-hq/components';
import { Calendar, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SheetWithDetentFull } from '../ui/sheet-with-detent-full';
import { MasterInviteCard } from './master-invite-card';

interface EventInvitesSheetProps {
  showInvitesSheet: boolean;
  setShowInvitesSheet: (show: boolean) => void;
  handleRSVP: (eventId: string) => void;
}

export function EventInvitesSheet({
  showInvitesSheet,
  setShowInvitesSheet,
  handleRSVP,
}: EventInvitesSheetProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'responded'>('pending');
  const [loadedTabs, setLoadedTabs] = useState<Set<'pending' | 'responded'>>(new Set(['pending']));

  // Only load data for tabs that have been opened
  const { data: pendingInvites = [], isLoading: isLoadingPending } = useEventInvites(
    'pending',
    loadedTabs.has('pending')
  );
  const { data: respondedInvites = [], isLoading: isLoadingResponded } = useEventInvites(
    'responded',
    loadedTabs.has('responded')
  );

  // Track when tabs are opened for lazy loading
  useEffect(() => {
    if (showInvitesSheet && !loadedTabs.has(activeTab)) {
      setLoadedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, showInvitesSheet, loadedTabs]);

  // Reset loaded tabs when sheet closes
  useEffect(() => {
    if (!showInvitesSheet) {
      setLoadedTabs(new Set(['pending'])); // Always keep pending loaded for the main section
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
              <SegmentedTabs
                items={[
                  {
                    value: 'pending',
                    label: `Waiting (${pendingInvites.length})`,
                  },
                  { value: 'responded', label: 'Archive' },
                ]}
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as 'pending' | 'responded')}
                wrapperClassName='mb-4 px-0 py-0'
                align='left'
              />
            </div>

            {/* Scrollable content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='pb-safe flex-1 overflow-y-auto'>
                <SheetWithDetentFull.ScrollContent>
                  <div className='px-4 pb-6'>
                    {activeTab === 'pending' ? (
                      isLoadingPending ? (
                        <div className='space-y-4'>
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className='h-32 animate-pulse rounded-2xl bg-gray-100' />
                          ))}
                        </div>
                      ) : pendingInvites.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-16 text-center'>
                          <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                            <Calendar className='h-8 w-8 text-gray-400' />
                          </div>
                          <h3 className='mb-1 text-base font-semibold text-gray-900'>
                            No pending invites
                          </h3>
                          <p className='text-sm text-gray-500'>You&apos;re all caught up!</p>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          {pendingInvites.map((invite: EventInvite) => (
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
                      <div className='flex flex-col items-center justify-center py-16 text-center'>
                        <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                          <Check className='h-8 w-8 text-gray-400' />
                        </div>
                        <h3 className='mb-1 text-base font-semibold text-gray-900'>
                          No responded invites
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Invites you respond to will appear here
                        </p>
                      </div>
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
