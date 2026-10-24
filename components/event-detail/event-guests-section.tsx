'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import GuestsSheet from '@/components/event-detail/event-guests-sheet';
import { EventSection } from '@/components/event-detail/event-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventHost } from '@/lib/hooks/use-event-hosts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { Share, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import InviteUsersSheet from '../manage-event/invite-users-sheet';
import { UserAvatar } from '../ui/user-avatar';

interface GuestsSectionProps {
  eventId: string;
  eventCreatorUserId: string;
  hosts: EventHost[];
  currentUserId?: string;
}

export default function EventGuestsSection({
  eventId,
  eventCreatorUserId,
  hosts,
  currentUserId,
}: GuestsSectionProps) {
  const router = useRouter();
  const { data: rsvps = [], isLoading, error, refetch } = useEventRSVPs(eventId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const isHostOrCoHost = useMemo(() => {
    if (!currentUserId) return false;
    if (eventCreatorUserId === currentUserId) return true;
    return hosts?.some((h) => h.user_details?.id === currentUserId);
  }, [currentUserId, eventCreatorUserId, hosts]);

  const hostUserIds = useMemo(
    () => hosts.map((host) => host.user_details?.id).filter(Boolean) as string[],
    [hosts]
  );

  const goingRSVPs = useMemo(() => {
    return rsvps.filter((r) => r.status === 'yes');
  }, [rsvps]);
  const goingCount = goingRSVPs.length;

  // Avatars to display (up to 4)
  const display = goingRSVPs.slice(0, 4);
  const remaining = Math.max(0, goingCount - display.length);

  // Loading state: show lightweight skeleton row
  if (isLoading) {
    return (
      <EventSection title='Guests'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton
                key={idx}
                className='relative h-10 w-10 rounded-full border-2 border-white dark:border-neutral-900'
                style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 4 - idx }}
              />
            ))}
          </div>
          <Skeleton className='h-4 w-16' />
        </div>
      </EventSection>
    );
  }

  // Error state: show retry affordance
  if (error) {
    return (
      <EventSection
        title='Guests'
        action={
          <Button variant='outline' size='sm' onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        <p className='text-sm text-red-500 dark:text-red-400'>Failed to load guests.</p>
      </EventSection>
    );
  }

  if (goingCount === 0 && display.length === 0) return null;

  const handlePrimaryClick = async () => {
    if (isHostOrCoHost) {
      setIsInviteOpen(true);
    } else {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/e/${eventId}` : '';
      if (navigator.share) {
        try {
          await navigator.share({ url });
        } catch (e) {
          // ignore
        }
      } else if (url) {
        await navigator.clipboard.writeText(url);
      }
    }
  };

  return (
    <>
      <EventSection
        title={
          <span className='inline-flex items-center gap-2'>
            Guests
            <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'>
              {goingCount}
            </span>
          </span>
        }
        action={
          isHostOrCoHost ? (
            <button
              type='button'
              onClick={handlePrimaryClick}
              className='inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
            >
              <UserPlus className='h-4 w-4' /> Invite
            </button>
          ) : (
            <CircledIconButton icon={Share} onClick={handlePrimaryClick} />
          )
        }
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='flex items-center'>
              {display.map((r, idx) => (
                <button
                  type='button'
                  key={r.id ?? `${r.user_id ?? 'guest'}-${r.status}-${idx}`}
                  className='relative rounded-full ring-2 ring-white dark:ring-neutral-900'
                  style={{
                    marginLeft: idx > 0 ? -8 : 0,
                    zIndex: display.length - idx,
                  }}
                  onClick={() => setSheetOpen(true)}
                  aria-label={`View ${
                    r.user_details?.name || r.user_details?.username || 'guest'
                  } details`}
                >
                  <UserAvatar
                    user={{
                      name: r.user_details?.name || undefined,
                      username: r.user_details?.username || undefined,
                      image: r.user_details?.image || undefined,
                      verification_status: undefined,
                    }}
                    size='base'
                  />
                </button>
              ))}
              {remaining > 0 && (
                <button
                  type='button'
                  className='relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-gray-600 dark:border-neutral-900 dark:bg-neutral-800 dark:text-neutral-300'
                  style={{ marginLeft: -8 }}
                  onClick={() => setSheetOpen(true)}
                  aria-label='Open full guest list'
                >
                  +{remaining}
                </button>
              )}
            </div>
            <p className='truncate text-sm text-gray-500 dark:text-neutral-500'>
              {goingCount} going
            </p>
          </div>
          <button
            type='button'
            onClick={() => setSheetOpen(true)}
            className='shrink-0 text-sm font-medium text-gray-900 hover:underline dark:text-neutral-100'
          >
            See all
          </button>
        </div>

        <GuestsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          rsvps={rsvps}
          eventCreatorUserId={eventCreatorUserId}
          hostUserIds={hostUserIds}
          currentUserId={currentUserId}
        />
      </EventSection>

      {/* Invite Users Sheet */}
      {isInviteOpen && (
        <InviteUsersSheet
          eventId={eventId}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </>
  );
}
