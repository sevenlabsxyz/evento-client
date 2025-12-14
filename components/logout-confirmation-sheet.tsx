'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { hasWalletData } from '@/lib/utils/logout-cleanup';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';
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
  const router = useRouter();
  const showWalletWarning = hasWalletData();

  const handleBackupFirst = () => {
    onClose();
    router.push('/e/wallet/settings');
  };

  const title = showWalletWarning ? 'Warning: Wallet Data' : 'Log Out';

  return (
    <MasterScrollableSheet
      title={title}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerLeft={
        <div className='flex items-center gap-3'>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              showWalletWarning ? 'bg-amber-50' : 'bg-gray-100'
            }`}
          >
            {showWalletWarning ? (
              <AlertTriangle className='h-5 w-5 text-amber-500' />
            ) : (
              <LogOut className='h-5 w-5 text-gray-500' />
            )}
          </div>
          <h2 className='text-xl font-semibold'>{title}</h2>
        </div>
      }
    >
      <div className='px-4 pb-8'>
        {/* Body */}
        <div className='mb-6 space-y-4 text-gray-600'>
          {showWalletWarning ? (
            <>
              <p className='font-medium text-gray-900'>You have a wallet set up on this device.</p>
              <p>
                Logging out will permanently delete your wallet data from this device, including
                your encrypted seed phrase.
              </p>
              <div className='rounded-lg bg-amber-50 p-3 text-amber-800'>
                <p className='flex items-center gap-2 font-medium'>
                  <Shield className='h-4 w-4' />
                  Make sure you have a backup!
                </p>
                <p className='mt-1 text-sm'>
                  Without a backup, you will lose access to any funds permanently.
                </p>
              </div>
            </>
          ) : (
            <p>
              Are you sure you want to log out? You&apos;ll need to sign in again to access your
              account.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-3'>
          {showWalletWarning && (
            <Button onClick={handleBackupFirst} className='w-full'>
              <Shield className='mr-2 h-4 w-4' />
              Back Up Wallet First
            </Button>
          )}
          <Button onClick={onConfirm} variant='destructive' className='w-full' disabled={isLoading}>
            {isLoading ? 'Logging out...' : 'Log Out'}
          </Button>
          <Button onClick={onClose} variant='outline' className='w-full'>
            Cancel
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
