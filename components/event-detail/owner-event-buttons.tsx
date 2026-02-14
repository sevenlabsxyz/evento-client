'use client';

import DetachedMenuSheet from '@/components/ui/detached-menu-sheet';
import { toast } from '@/lib/utils/toast';
import { Copy, EyeOff, Image, Link, Mail, MoreHorizontal, Settings, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InviteUsersSheet from '../manage-event/invite-users-sheet';

interface OwnerEventButtonsProps {
  eventId: string;
}

export default function OwnerEventButtons({ eventId }: OwnerEventButtonsProps) {
  const router = useRouter();
  const [hideGuestList, setHideGuestList] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  const handleInvite = () => {
    setIsInviteOpen(true);
  };

  const handleManage = () => {
    router.push(`/e/${eventId}/manage`);
  };

  const handleEmailBlasts = () => {
    router.push(`/e/${eventId}/manage/email-blast`);
  };

  const handleGallerySettings = () => {
    router.push(`/e/${eventId}/gallery`);
  };

  const handleToggleGuestList = () => {
    setHideGuestList(!hideGuestList);
    router.push(`/e/${eventId}/manage/guests`);
  };

  const handleEventLink = () => {
    const eventUrl = `${window.location.origin}/e/${eventId}`;
    toast.info(`Event link: ${eventUrl}`);
  };

  const handleCopyEventLink = async () => {
    const eventUrl = `${window.location.origin}/e/${eventId}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = eventUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Event link copied to clipboard!');
    }
  };

  const handleCheckInGuests = () => {
    // TODO: Implement check-in guests functionality
  };

  return (
    <div className='grid grid-cols-4 gap-2'>
      {/* Invite Button */}
      <button
        onClick={handleInvite}
        className='flex h-16 flex-col items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600'
      >
        <UserPlus className='mb-1 h-5 w-5' />
        <span className='text-xs font-medium'>Invite</span>
      </button>

      {/* Manage Button */}
      <button
        onClick={handleManage}
        className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
      >
        <Settings className='mb-1 h-5 w-5' />
        <span className='text-xs font-medium'>Manage</span>
      </button>

      {/* Blasts Button */}
      <button
        onClick={handleEmailBlasts}
        className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
      >
        <Mail className='mb-1 h-5 w-5' />
        <span className='text-xs font-medium'>Blasts</span>
      </button>

      {/* More Button */}
      <button
        onClick={() => setMoreOptionsOpen(true)}
        className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
      >
        <MoreHorizontal className='mb-1 h-5 w-5' />
        <span className='text-xs font-medium'>More</span>
      </button>

      {/* More Options Sheet */}
      <DetachedMenuSheet
        isOpen={moreOptionsOpen}
        onClose={() => setMoreOptionsOpen(false)}
        options={[
          {
            id: 'gallery-settings',
            label: 'Gallery Settings',
            icon: Image,
            onClick: () => {
              handleGallerySettings();
              setMoreOptionsOpen(false);
            },
          },
          {
            id: 'hide-guest-list',
            label: 'Hide Guest List',
            icon: EyeOff,
            onClick: () => {
              handleToggleGuestList();
              setMoreOptionsOpen(false);
            },
          },
          {
            id: 'event-link',
            label: 'Event Link',
            icon: Link,
            onClick: () => {
              handleEventLink();
              setMoreOptionsOpen(false);
            },
          },
          {
            id: 'copy-event-link',
            label: 'Copy Event Link',
            icon: Copy,
            onClick: () => {
              handleCopyEventLink();
              setMoreOptionsOpen(false);
            },
          },
        ]}
      />

      {/* Invite Users Sheet */}
      {isInviteOpen && (
        <InviteUsersSheet
          eventId={eventId}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </div>
  );
}
