'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { UserBadge } from '@/lib/types/badges';
import { format } from 'date-fns';
import Image from 'next/image';

interface BadgeDetailSheetProps {
  badge: UserBadge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeDetailSheet({ badge, isOpen, onClose }: BadgeDetailSheetProps) {
  if (!badge) return null;

  const earnedDate = badge.earned_at ? format(new Date(badge.earned_at), 'MMMM d, yyyy') : null;

  return (
    <MasterScrollableSheet
      title={badge.badge.name}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='px-4 pb-8'
    >
      <div className='flex flex-col items-center space-y-6'>
        {/* Badge Image */}
        <div className='relative h-32 w-32 overflow-hidden rounded-full bg-gray-100'>
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
        <h2 className='text-2xl font-bold text-gray-900'>{badge.badge.name}</h2>

        {/* Badge Description */}
        {badge.badge.description && (
          <p className='text-center text-gray-600'>{badge.badge.description}</p>
        )}

        {/* Earned Date */}
        {earnedDate && (
          <div className='rounded-xl bg-gray-100 px-4 py-3 text-center'>
            <p className='text-sm text-gray-500'>Earned on</p>
            <p className='font-medium text-gray-900'>{earnedDate}</p>
          </div>
        )}

        {/* Badge Type */}
        {badge.badge.type && (
          <div className='rounded-full bg-amber-100 px-3 py-1'>
            <p className='text-sm font-medium capitalize text-amber-700'>{badge.badge.type}</p>
          </div>
        )}
      </div>
    </MasterScrollableSheet>
  );
}
