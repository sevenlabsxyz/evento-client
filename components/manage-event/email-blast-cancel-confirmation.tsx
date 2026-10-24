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
import { useTranslations } from 'next-intl';

interface EmailBlastCancelConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export default function EmailBlastCancelConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isCancelling,
}: EmailBlastCancelConfirmationProps) {
  const t = useTranslations('manageLegacy');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('emailBlast.cancelDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('emailBlast.cancelDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>
            {t('emailBlast.cancelDialog.keep')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isCancelling}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:text-white'
          >
            {isCancelling ? t('emailBlast.cancelling') : t('emailBlast.cancelDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
