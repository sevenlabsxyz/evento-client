'use client';

import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDuplicateEvent } from '@/lib/hooks/use-duplicate-event';
import type { EventDashboard } from '@/lib/types/manage';
import { getAbsoluteAppUrl } from '@/lib/utils/app-url';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { CircleX, Copy, CopyPlus, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export async function copyEventLink(eventId: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(getAbsoluteAppUrl(`/e/${eventId}`));
    toast.success('Event link copied to clipboard');
  } catch (error) {
    logger.error('Failed to copy event link', { error, eventId });
    toast.error('Could not copy the event link');
  }
}

interface ManageMoreMenuProps {
  event: Pick<EventDashboard['event'], 'id' | 'title' | 'status'>;
}

export function ManageMoreMenu({ event }: ManageMoreMenuProps) {
  const router = useRouter();
  const duplicateEvent = useDuplicateEvent();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isArchived = event.status === 'archived';

  const handleDuplicate = () => {
    duplicateEvent.mutate(event.id, {
      onSuccess: (duplicated) => {
        toast.success('Event duplicated as a draft');
        router.push(`/e/${duplicated.id}/manage`);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Failed to duplicate event');
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='h-9 w-9 shrink-0 rounded-full dark:bg-neutral-900 dark:hover:bg-neutral-800'
            aria-label='More event actions'
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem onSelect={() => void copyEventLink(event.id)}>
            <Copy className='mr-2 h-4 w-4' />
            Copy event link
          </DropdownMenuItem>
          <DropdownMenuItem disabled={duplicateEvent.isPending} onSelect={handleDuplicate}>
            <CopyPlus className='mr-2 h-4 w-4' />
            {duplicateEvent.isPending ? 'Duplicating...' : 'Duplicate event'}
          </DropdownMenuItem>
          {!isArchived && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowCancelModal(true)}
                className='text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300'
              >
                <CircleX className='mr-2 h-4 w-4' />
                Cancel event
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isArchived && (
        <CancelEventModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          eventId={event.id}
          eventTitle={event.title}
        />
      )}
    </>
  );
}
