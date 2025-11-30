'use client';

import { WalletStorageService } from '@/lib/services/wallet-storage';
import { ChevronRight, Shield, X } from 'lucide-react';

interface BackupCalloutProps {
  onBackup: () => void;
  onDismiss: () => void;
}

export function BackupCallout({ onBackup, onDismiss }: BackupCalloutProps) {
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    WalletStorageService.dismissBackupForToday();
    onDismiss();
  };

  return (
    <button
      onClick={onBackup}
      className='flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100'
    >
      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200'>
        <Shield className='h-5 w-5 text-gray-600' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-gray-900'>Secure your wallet</p>
        <p className='text-sm text-gray-500'>Back up to protect your funds</p>
      </div>
      <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
      <button
        onClick={handleDismiss}
        className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200'
        aria-label='Dismiss for today'
      >
        <X className='h-4 w-4 text-gray-400' />
      </button>
    </button>
  );
}
