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
      className='flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-gray-100'
    >
      <CircledIconButton icon={Shield} onClick={() => {}} />
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-gray-900'>Secure your wallet</p>
        <p className='text-sm text-gray-500'>Back up to protect your funds</p>
      </div>
      <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
    </button>
  );
}
