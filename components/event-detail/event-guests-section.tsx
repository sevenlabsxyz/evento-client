'use client';

import GuestsSheet from '@/components/event-detail/event-guests-sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EventHost } from '@/lib/hooks/use-event-hosts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useRSVPStats } from '@/lib/hooks/use-rsvp-stats';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

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
  const { data: stats } = useRSVPStats(eventId);
  const { data: rsvps = [], isLoading, error, refetch } = useEventRSVPs(eventId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isHostOrCoHost = useMemo(() => {
    if (!currentUserId) return false;
    if (eventCreatorUserId === currentUserId) return true;
    return hosts?.some((h) => h.user_details?.id === currentUserId);
  }, [currentUserId, eventCreatorUserId, hosts]);

  const goingRSVPs = useMemo(() => rsvps.filter((r) => r.status === 'yes'), [rsvps]);
  const goingCount = stats?.yes_only ?? goingRSVPs.length;

  // Avatars to display (up to 4)
  const display = goingRSVPs.slice(0, 4);
  const remaining = Math.max(0, goingCount - display.length);

  // Loading state: show lightweight skeleton row
  if (isLoading) {
    return (
      <div className='border-t border-gray-100 py-6'>
        <div className='mb-3 flex items-start justify-between'>
          <div>
            <div className='h-5 w-28 animate-pulse rounded bg-gray-200' />
            <div className='mt-2 h-4 w-20 animate-pulse rounded bg-gray-200' />
          </div>
          <div className='h-8 w-24 animate-pulse rounded-md bg-gray-200' />
        </div>
        <div className='flex items-center'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className='relative h-10 w-10 animate-pulse rounded-full border-2 border-white bg-gray-200'
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
      router.push(`/e/${eventId}/invite`);
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
    <div className='border-t border-gray-100 py-6'>
      <div className='mb-3 flex items-start justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Guest List</h3>
          <p className='text-sm text-gray-500'>{goingCount} going</p>
        </div>
        <Button variant='outline' size='sm' onClick={handlePrimaryClick}>
          {isHostOrCoHost ? (
            <span className='inline-flex items-center gap-1'>
              Invite <span aria-hidden>→</span>
            </span>
          ) : (
            <span className='inline-flex items-center gap-1'>
              Share Event <span aria-hidden>↗</span>
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
            <Avatar className='h-10 w-10 border-2 border-white shadow'>
              <AvatarImage
                src={r.user_details?.image || ''}
                alt={r.user_details?.name || r.user_details?.username || 'Guest'}
              />
              <AvatarFallback>
                <Image src='/assets/img/evento-sublogo.svg' alt='Evento' width={24} height={24} />
              </AvatarFallback>
            </Avatar>
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
  );
}
