'use client';

import DetachedMenuSheet from '@/components/ui/detached-menu-sheet';
import { toast } from '@/lib/utils/toast';
import { Copy, Link, Mail, MoreHorizontal, Settings, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InviteUsersSheet from '../manage-event/invite-users-sheet';

interface OwnerEventButtonsProps {
  eventId: string;
}

export default function OwnerEventButtons({ eventId }: OwnerEventButtonsProps) {
  const router = useRouter();
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

  const secondaryTileClassName =
    'flex h-16 flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700';

  return (
    <div className='grid grid-cols-4 gap-2'>
      {/* Invite Button */}
      <button
        type='button'
        onClick={handleInvite}
        className='flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
      >
        <UserPlus className='h-5 w-5' aria-hidden='true' />
        <span className='text-xs font-semibold'>Invite</span>
      </button>

      {/* Manage Button */}
      <button type='button' onClick={handleManage} className={secondaryTileClassName}>
        <Settings className='h-5 w-5' aria-hidden='true' />
        <span className='text-xs font-medium'>Manage</span>
      </button>

      {/* Blasts Button */}
      <button type='button' onClick={handleEmailBlasts} className={secondaryTileClassName}>
        <Mail className='h-5 w-5' aria-hidden='true' />
        <span className='text-xs font-medium'>Blasts</span>
      </button>

      {/* More Button */}
      <button
        type='button'
        onClick={() => setMoreOptionsOpen(true)}
        className={secondaryTileClassName}
      >
        <MoreHorizontal className='h-5 w-5' aria-hidden='true' />
        <span className='text-xs font-medium'>More</span>
      </button>

      {/* More Options Sheet */}
      <DetachedMenuSheet
        isOpen={moreOptionsOpen}
        onClose={() => setMoreOptionsOpen(false)}
        options={[
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
