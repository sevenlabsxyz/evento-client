'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { UserBadge } from '@/lib/types/badges';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

interface BadgeDetailSheetProps {
  badge: UserBadge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeDetailSheet({ badge, isOpen, onClose }: BadgeDetailSheetProps) {
  const t = useTranslations('profile');
  const locale = useLocale();
  if (!badge) return null;

  const earnedDate = badge.earned_at
    ? new Date(badge.earned_at).toLocaleDateString(getIntlLocale(locale), {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <MasterScrollableSheet
      title={badge.badge.name}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='px-4 pb-8'
    >
      <div className='flex flex-col items-center space-y-6'>
        {/* Badge Image */}
        <div className='relative h-32 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800'>
          {badge.badge.image_url ? (
            <Image
              src={badge.badge.image_url}
              alt={badge.badge.name}
              width={128}
              height={128}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white'>
              <span className='text-4xl font-bold'>{badge.badge.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Badge Name */}
        <h2 className='text-2xl font-bold text-gray-900 dark:text-neutral-100'>
          {badge.badge.name}
        </h2>

        {/* Badge Description */}
        {badge.badge.description && (
          <p className='text-center text-gray-600 dark:text-neutral-400'>
            {badge.badge.description}
          </p>
        )}

        {/* Earned Date */}
        {earnedDate && (
          <div className='rounded-xl bg-gray-100 px-4 py-3 text-center dark:bg-neutral-800'>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('badges.earnedOn')}</p>
            <p className='font-medium text-gray-900 dark:text-neutral-100'>{earnedDate}</p>
          </div>
        )}

        {/* Badge Type */}
        {badge.badge.type && (
          <div className='rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-950/60'>
            <p className='text-sm font-medium capitalize text-amber-700 dark:text-amber-400'>
              {badge.badge.type}
            </p>
          </div>
        )}
      </div>
    </MasterScrollableSheet>
  );
}
