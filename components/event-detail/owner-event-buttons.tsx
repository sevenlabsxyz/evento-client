'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import DetachedMenuSheet from '@/components/ui/detached-menu-sheet';
import { useDuplicateEvent } from '@/lib/hooks/use-duplicate-event';
import { toast } from '@/lib/utils/toast';
import { Copy, Link, Mail, MoreHorizontal, Settings, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InviteUsersSheet from '../manage-event/invite-users-sheet';

interface OwnerEventButtonsProps {
  eventId: string;
  eventTitle: string;
}

export default function OwnerEventButtons({ eventId, eventTitle }: OwnerEventButtonsProps) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const duplicateEvent = useDuplicateEvent();

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

  const handleOpenDuplicateDialog = () => {
    setMoreOptionsOpen(false);
    setShowDuplicateDialog(true);
  };

  const handleDuplicateEvent = async () => {
    try {
      const duplicatedEvent = await duplicateEvent.mutateAsync(eventId);
      toast.success('Draft duplicate created');
      setShowDuplicateDialog(false);
      router.push(`/e/${duplicatedEvent.id}/manage/details`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to duplicate event');
    }
  };

  return (
    <>
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
              id: 'duplicate-event',
              label: 'Duplicate Event',
              icon: Copy,
              onClick: handleOpenDuplicateDialog,
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

      <AlertDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          if (!duplicateEvent.isPending) {
            setShowDuplicateDialog(open);
          }
        }}
      >
        <AlertDialogContent className='max-w-sm rounded-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Event?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to duplicate{' '}
              <span className='font-medium text-gray-900'>{eventTitle}</span>. This will create a
              new draft event, copy over the existing event setup, and move the date seven days
              forward so you can review everything before publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateEvent.isPending}>Cancel</AlertDialogCancel>
            <Button onClick={handleDuplicateEvent} disabled={duplicateEvent.isPending}>
              {duplicateEvent.isPending ? 'Duplicating...' : 'Duplicate Event'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
