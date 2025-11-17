'use client';

import { EventInvite } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDate } from '@/lib/utils/date';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { VisuallyHidden } from '@silk-hq/components';
import { Check, Eye, MapPin, Users, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { DetachedSheet } from '../ui/detached-sheet';
import { UserAvatar } from '../ui/user-avatar';

interface EventInviteDetailSheetProps {
  invite: EventInvite | null;
  isOpen: boolean;
  onClose: () => void;
  onRSVP?: () => void;
}

export function EventInviteDetailSheet({
  invite,
  isOpen,
  onClose,
  onRSVP,
}: EventInviteDetailSheetProps) {
  const router = useRouter();

  if (!invite) return null;

  const { date: eventDate, timeWithTz: eventTime } = formatEventDate(
    invite.events.computed_start_date
  );

  const event = transformApiEventToDisplay(invite.events, [], []);

  const handleViewEvent = () => {
    router.push(`/e/${invite.event_id}`);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6 pb-8'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <VisuallyHidden.Root asChild>
                <DetachedSheet.Title>Event Invite</DetachedSheet.Title>
              </VisuallyHidden.Root>

              <div className='overflow-hidden rounded-2xl bg-white shadow-sm'>
                {/* Event Image */}
                {event.coverImages.length > 0 && (
                  <div className='relative mx-auto flex h-56 w-56'>
                    <Image
                      src={event.coverImages[0]}
                      alt={event.title}
                      fill
                      className='rounded-2xl border object-cover'
                    />
                  </div>
                )}

                <div className='p-6'>
                  <div className='mb-4 flex items-center gap-3 rounded-xl border bg-gray-100 p-4'>
                    <UserAvatar
                      user={{
                        name: event.hosts[0].name,
                        username: event.hosts[0].username,
                        image: event.hosts[0].avatar,
                      }}
                      className='shadow-none'
                      size='sm'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-gray-900'>{event.hosts[0].name}</p>
                      <p className='text-xs text-gray-500'>
                        invited you to an event on {eventDate} at {eventTime}
                      </p>
                    </div>
                  </div>

                  <div className='mb-4'>
                    <h3 className='mb-2 text-xl font-semibold text-gray-900'>{event.title}</h3>
                    <div
                      className={cn(
                        'mb-2 flex items-center text-sm text-gray-500',
                        invite.events.location ? '' : 'text-gray-400'
                      )}
                    >
                      <MapPin className='mr-1 h-4 w-4' />
                      <span>{invite.events.location || 'TBD'}</span>
                    </div>
                    {invite.message && <p className='text-sm text-gray-600'>"{invite.message}"</p>}
                  </div>

                  {invite.status === 'pending' && (
                    <div className='flex gap-2'>
                      <Button
                        size='default'
                        onClick={() => {
                          onRSVP?.();
                          onClose();
                        }}
                        className='flex-1 bg-red-500 text-white hover:bg-red-600'
                      >
                        <Users className='mr-2 h-4 w-4' />
                        RSVP
                      </Button>
                      <Button
                        size='default'
                        variant='outline'
                        onClick={handleViewEvent}
                        className='flex-1'
                      >
                        <Eye className='mr-2 h-4 w-4' />
                        View
                      </Button>
                    </div>
                  )}

                  {invite.status === 'responded' && invite.response && (
                    <div className='flex items-center justify-between'>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                          invite.response === 'going' && 'bg-green-100 text-green-800',
                          invite.response === 'maybe' && 'bg-yellow-100 text-yellow-800',
                          invite.response === 'not_going' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {invite.response === 'going' && <Check className='mr-1 h-3 w-3' />}
                        {invite.response === 'not_going' && <X className='mr-1 h-3 w-3' />}
                        {invite.response === 'going'
                          ? 'Going'
                          : invite.response === 'maybe'
                            ? 'Maybe'
                            : 'Not Going'}
                      </span>
                      <Button size='default' variant='outline' onClick={handleViewEvent}>
                        <Eye className='mr-2 h-4 w-4' />
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
