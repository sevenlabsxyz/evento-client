'use client';

import { DetachedSheet } from '@/components/ui/detached-sheet';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';

interface DeleteConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType?: string;
  isLoading?: boolean;
  // Copy overrides for non-delete actions (e.g. removing a link instead of deleting)
  title?: string;
  description?: string;
  confirmLabel?: string;
  loadingLabel?: string;
}

export default function DeleteConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  itemType = 'comment',
  isLoading = false,
  title,
  description,
  confirmLabel,
  loadingLabel,
}: DeleteConfirmationSheetProps) {
  const t = useTranslations('eventSocial');
  const tCommon = useTranslations('common');
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Header */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40'>
                  <AlertTriangle className='h-5 w-5 text-red-500 dark:text-red-400' />
                </div>
                <h2 className='text-xl font-semibold dark:text-neutral-100'>
                  {title ?? t('deleteSheet.title', { itemType })}
                </h2>
              </div>

              {/* Body */}
              <div className='mb-8 text-gray-600 dark:text-neutral-400'>
                <p>{description ?? t('deleteSheet.description', { itemType })}</p>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button onClick={onClose} variant='outline' className='w-full'>
                  {tCommon('actions.cancel')}
                </Button>
                <Button
                  onClick={handleConfirm}
                  variant='destructive'
                  className='w-full'
                  disabled={isLoading}
                >
                  {isLoading
                    ? (loadingLabel ?? t('deleteSheet.deleting'))
                    : (confirmLabel ?? t('deleteSheet.title', { itemType }))}
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
