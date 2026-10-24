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
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CopyEventLinkMessages {
  success: string;
  error: string;
}

export async function copyEventLink(
  eventId: string,
  messages: CopyEventLinkMessages
): Promise<void> {
  try {
    await navigator.clipboard.writeText(getAbsoluteAppUrl(`/e/${eventId}`));
    toast.success(messages.success);
  } catch (error) {
    logger.error('Failed to copy event link', { error, eventId });
    toast.error(messages.error);
  }
}

interface ManageMoreMenuProps {
  event: Pick<EventDashboard['event'], 'id' | 'title' | 'status'>;
}

export function ManageMoreMenu({ event }: ManageMoreMenuProps) {
  const t = useTranslations('manage');
  const router = useRouter();
  const duplicateEvent = useDuplicateEvent();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isArchived = event.status === 'archived';

  const handleDuplicate = () => {
    duplicateEvent.mutate(event.id, {
      onSuccess: (duplicated) => {
        toast.success(t('moreMenu.duplicated'));
        router.push(`/e/${duplicated.id}/manage`);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || t('moreMenu.duplicateFailed'));
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
            aria-label={t('moreMenu.ariaLabel')}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem
            onSelect={() =>
              void copyEventLink(event.id, {
                success: t('moreMenu.linkCopied'),
                error: t('moreMenu.linkCopyFailed'),
              })
            }
          >
            <Copy className='mr-2 h-4 w-4' />
            {t('moreMenu.copyLink')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={duplicateEvent.isPending} onSelect={handleDuplicate}>
            <CopyPlus className='mr-2 h-4 w-4' />
            {duplicateEvent.isPending ? t('moreMenu.duplicating') : t('moreMenu.duplicate')}
          </DropdownMenuItem>
          {!isArchived && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setShowCancelModal(true)}
                className='text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300'
              >
                <CircleX className='mr-2 h-4 w-4' />
                {t('moreMenu.cancelEvent')}
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
