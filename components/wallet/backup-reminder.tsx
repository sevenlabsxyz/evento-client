'use client';

import { Button } from '@/components/ui/button';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { AlertTriangle, X } from 'lucide-react';

interface BackupReminderProps {
  onBackup: () => void;
  onDismiss: () => void;
}

export function BackupReminder({ onBackup, onDismiss }: BackupReminderProps) {
  const handleDismiss = () => {
    WalletStorageService.updateBackupReminderTimestamp();
    onDismiss();
  };

  return (
    <div className='rounded-xl border-2 border-amber-200 bg-amber-50 p-4'>
      <div className='flex gap-3'>
        <AlertTriangle className='h-5 w-5 flex-shrink-0 text-amber-600' />
        <div className='flex-1'>
          <div className='flex items-start justify-between'>
            <h4 className='font-semibold text-amber-900'>Backup Your Wallet</h4>
            <button onClick={handleDismiss} className='rounded-full p-1 hover:bg-amber-100'>
              <X className='h-4 w-4 text-amber-600' />
            </button>
          </div>
          <p className='mt-1 text-sm text-amber-800'>
            Protect your funds by backing up your seed phrase. Without it, you won&apos;t be able to
            recover your wallet if you lose access to this device.
          </p>
          <div className='mt-3 flex gap-2'>
            <Button onClick={onBackup} size='sm' className='bg-amber-600 hover:bg-amber-700'>
              Backup Now
            </Button>
            <Button
              onClick={handleDismiss}
              size='sm'
              variant='ghost'
              className='text-amber-900 hover:bg-amber-100'
            >
              Remind Me Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
