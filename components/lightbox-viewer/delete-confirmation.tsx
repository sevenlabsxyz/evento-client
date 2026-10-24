'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DeleteConfirmationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmation = ({
  isOpen,
  setIsOpen,
  onConfirm,
  isDeleting,
}: DeleteConfirmationProps) => {
  const t = useTranslations('zap.lightbox');
  const tCommon = useTranslations('common');
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{tCommon('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-red-600 hover:bg-red-700'
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('deleting')}
              </>
            ) : (
              tCommon('actions.delete')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
