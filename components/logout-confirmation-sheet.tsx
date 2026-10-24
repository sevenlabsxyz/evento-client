'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { hasWalletData } from '@/lib/utils/logout-cleanup';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface LogoutConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function LogoutConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmationSheetProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const showWalletWarning = hasWalletData();

  const handleBackupFirst = () => {
    onClose();
    router.push('/e/wallet/settings');
  };

  const title = showWalletWarning ? t('logout.walletWarningTitle') : t('logout.title');

  return (
    <MasterScrollableSheet
      title={title}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerLeft={
        <div className='flex items-center gap-3'>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              showWalletWarning
                ? 'bg-amber-50 dark:bg-amber-950/40'
                : 'bg-gray-100 dark:bg-neutral-800'
            }`}
          >
            {showWalletWarning ? (
              <AlertTriangle className='h-5 w-5 text-amber-500 dark:text-amber-400' />
            ) : (
              <LogOut className='h-5 w-5 text-gray-500 dark:text-neutral-400' />
            )}
          </div>
          <h2 className='text-xl font-semibold'>{title}</h2>
        </div>
      }
    >
      <div className='px-4 pb-8'>
        {/* Body */}
        <div className='mb-6 space-y-4 text-gray-600 dark:text-neutral-400'>
          {showWalletWarning ? (
            <>
              <p className='font-medium text-gray-900 dark:text-neutral-100'>
                {t('logout.walletOnDevice')}
              </p>
              <p>{t('logout.walletDeleteWarning')}</p>
              <div className='rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'>
                <p className='flex items-center gap-2 font-medium'>
                  <Shield className='h-4 w-4' />
                  {t('logout.backupReminder')}
                </p>
                <p className='mt-1 text-sm'>{t('logout.backupLoss')}</p>
              </div>
            </>
          ) : (
            <p>{t('logout.confirmMessage')}</p>
          )}
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-3'>
          {showWalletWarning && (
            <Button onClick={handleBackupFirst} className='w-full'>
              <Shield className='mr-2 h-4 w-4' />
              {t('logout.backUpFirst')}
            </Button>
          )}
          <Button onClick={onConfirm} variant='destructive' className='w-full' disabled={isLoading}>
            {isLoading ? t('logout.loggingOut') : t('logout.confirm')}
          </Button>
          <Button onClick={onClose} variant='outline' className='w-full'>
            {tCommon('actions.cancel')}
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
