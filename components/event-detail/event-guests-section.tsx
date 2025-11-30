'use client';

import GuestsSheet from '@/components/event-detail/event-guests-sheet';
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
      <div className='border-t border-gray-100 py-6'>
        <div className='mb-3 flex items-start justify-between'>
          <div>
            <Skeleton className='h-5 w-28' />
            <Skeleton className='mt-2 h-4 w-20' />
          </div>
          <Skeleton className='h-8 w-24 rounded-md' />
        </div>
        <div className='flex items-center'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton
              key={idx}
              className='relative h-10 w-10 rounded-full border-2 border-white'
              style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 4 - idx }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state: show retry affordance
  if (error) {
    return (
      <div className='border-t border-gray-100 py-6'>
        <div className='mb-3 flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Guest List</h3>
            <p className='text-sm text-red-500'>Failed to load guests.</p>
          </div>
          <Button variant='outline' size='sm' onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
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
          await navigator.share({ title: 'Check out this event', url });
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
      <div className='border-t border-gray-100 py-6'>
        <div className='mb-3 flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Guest List</h3>
            <p className='text-sm text-gray-500'>{goingCount} going</p>
          </div>
          <Button variant='outline' size='sm' onClick={handlePrimaryClick}>
            {isHostOrCoHost ? (
              <span className='inline-flex items-center gap-2'>
                <UserPlus className='h-4 w-4' /> Invite
              </span>
            ) : (
              <span className='inline-flex items-center gap-2'>
                <Share className='h-4 w-4' /> Share Event
              </span>
            )}
          </Button>
        </div>

        <div className='flex items-center'>
          {display.map((r, idx) => (
            <button
              key={r.id}
              className='relative'
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
                  verification_status: r.user_details?.verification_status || null,
                }}
                size='base'
              />
            </button>
          ))}
          {remaining > 0 && (
            <button
              className='relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600'
              style={{ marginLeft: -8 }}
              onClick={() => setSheetOpen(true)}
              aria-label='Open full guest list'
            >
              +{remaining}
            </button>
          )}
        </div>

        <GuestsSheet open={sheetOpen} onOpenChange={setSheetOpen} rsvps={rsvps} />
      </div>

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
