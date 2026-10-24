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

interface DeveloperModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeveloperModeDialog({ open, onOpenChange, onConfirm }: DeveloperModeDialogProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('developerModeDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <span className='block'>{t('developerModeDialog.intro')}</span>
            <span className='block font-medium text-amber-600 dark:text-amber-400'>
              {t('developerModeDialog.warning')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-amber-600 hover:bg-amber-700 focus:ring-amber-600'
          >
            {t('developerModeDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
