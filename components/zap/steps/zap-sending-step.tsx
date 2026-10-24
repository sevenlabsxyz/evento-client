'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ZapSendingStep() {
  const t = useTranslations('zap.steps');
  return (
    <div className='flex flex-col items-center justify-center p-12'>
      <Loader2 className='h-16 w-16 animate-spin text-red-500 dark:text-red-400' />
      <p className='mt-6 text-xl font-semibold text-gray-900 dark:text-neutral-100'>
        {t('sendingZap')}
      </p>
      <p className='mt-2 text-sm text-gray-500 dark:text-neutral-400'>{t('pleaseWait')}</p>
    </div>
  );
}
