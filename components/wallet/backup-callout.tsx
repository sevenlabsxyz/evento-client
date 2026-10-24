'use client';

import { ChevronRight, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CircledIconButton } from '../circled-icon-button';

interface BackupCalloutProps {
  onBackup: () => void;
}

export function BackupCallout({ onBackup }: BackupCalloutProps) {
  const t = useTranslations('wallet');
  return (
    <button
      onClick={onBackup}
      className='flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:hover:bg-red-950/60'
    >
      <CircledIconButton
        icon={Shield}
        onClick={() => {}}
        className='border-red-200 text-red-600 dark:border-red-900 dark:text-red-400'
      />
      <div className='min-w-0 flex-1'>
        <p className='font-medium text-red-900 dark:text-red-400'>{t('backupCallout.title')}</p>
        <p className='text-sm text-red-600 dark:text-red-400'>{t('backupCallout.description')}</p>
      </div>
      <ChevronRight className='h-5 w-5 flex-shrink-0 text-red-400' />
    </button>
  );
}
