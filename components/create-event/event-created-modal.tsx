'use client';

import { ArrowRight, Check, Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InviteUsersSheet from '../manage-event/invite-users-sheet';
import { Button } from '../ui/button';

interface EventCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    date: Date;
    time: { hour: number; minute: number; period: 'AM' | 'PM' };
    status?: 'draft' | 'published';
    type?: 'rsvp' | 'registration' | 'ticketed';
    nextRoute?: string;
    ctaLabel?: string;
  };
}

export default function EventCreatedModal({ isOpen, onClose, eventData }: EventCreatedModalProps) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const isDraft = eventData.status === 'draft';

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute
      .toString()
      .padStart(2, '0')} ${time.period}`;
  };

  const handleViewEvent = () => {
    onClose();
    router.push(eventData.nextRoute || `/e/${eventData.id}`);
  };

  const handleInviteGuests = () => {
    setIsInviteOpen(true);
  };

  return (
    <>
      <div className='fixed inset-0 z-50 bg-white'>
        {/* Close Button */}
        <div className='absolute right-4 top-4'>
          <button onClick={handleViewEvent} className='rounded-full p-2 hover:bg-gray-100'>
            <X className='h-6 w-6 text-gray-400' />
          </button>
        </div>

        {/* Content */}
        <div className='flex min-h-screen flex-col items-center justify-center px-6 text-center'>
          {/* Success Icon */}
          <div
            className={`mb-8 flex h-20 w-20 items-center justify-center rounded-full ${
              isDraft ? 'bg-blue-500' : 'bg-green-500'
            }`}
          >
            <Check className='h-10 w-10 text-white' />
          </div>

          {/* Title */}
          <h1 className='mb-4 text-2xl font-medium text-gray-500'>
            {isDraft ? 'Draft Created!' : 'Event Created!'}
          </h1>

          {/* Event Name */}
          <h2 className='mb-8 text-4xl font-bold text-gray-900'>{eventData.title}</h2>

          {isDraft && (
            <p className='mb-8 max-w-sm text-base text-gray-600'>
              Great work. Next up, complete setup and publish when you are ready.
            </p>
          )}

          {/* Date and Time */}
          <div className='mb-16 flex items-center gap-2 text-gray-500'>
            <Clock className='h-5 w-5' />
            <span className='text-lg'>
              {formatDate(eventData.date)} at {formatTime(eventData.time)} PDT
            </span>
          </div>

          {/* Actions */}
          <div className='w-full max-w-sm space-y-4'>
            <Button onClick={handleViewEvent} className='h-14 w-full rounded-full text-lg'>
              {eventData.ctaLabel || (isDraft ? 'Continue Setup' : 'View Event Page')}
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>

            {!isDraft && (
              <button
                onClick={handleInviteGuests}
                className='w-full py-4 text-lg font-medium text-gray-500'
              >
                Invite Guests
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Users Sheet */}
      {isInviteOpen && (
        <InviteUsersSheet
          eventId={eventData.id}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </>
  );
}
