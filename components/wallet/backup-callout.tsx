'use client';

import { ChevronRight, Shield } from 'lucide-react';
import { CircledIconButton } from '../circled-icon-button';

interface BackupCalloutProps {
  onBackup: () => void;
}

export function BackupCallout({ onBackup }: BackupCalloutProps) {
  return (
    <button
      onClick={onBackup}
      className='flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-red-100'
    >
      <CircledIconButton icon={Shield} onClick={() => {}} className='border-red-200 text-red-600' />
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-red-900'>Secure your wallet</p>
        <p className='text-sm text-red-600'>Back up to protect your funds</p>
      </div>
      <ChevronRight className='h-5 w-5 flex-shrink-0 text-red-400' />
    </button>
  );
}
