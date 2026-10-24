'use client';

import { useTranslations } from 'next-intl';

interface ProfileStatsProps {
  eventCount: number;
  followingCount: number;
  followersCount: number;
}

export function ProfileStats({ eventCount, followingCount, followersCount }: ProfileStatsProps) {
  const t = useTranslations('zap.quickProfile');
  const tCommon = useTranslations('common');
  return (
    <div className='mb-3 flex justify-center'>
      <div className='grid grid-cols-3 gap-8'>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900 dark:text-neutral-100'>{eventCount}</div>
          <div className='text-sm text-gray-500 dark:text-neutral-400'>
            {tCommon('labels.events')}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900 dark:text-neutral-100'>
            {followingCount}
          </div>
          <div className='text-sm text-gray-500 dark:text-neutral-400'>{t('following')}</div>
        </div>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900 dark:text-neutral-100'>
            {followersCount}
          </div>
          <div className='text-sm text-gray-500 dark:text-neutral-400'>{t('followers')}</div>
        </div>
      </div>
    </div>
  );
}
