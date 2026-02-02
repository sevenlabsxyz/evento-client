'use client';

import { Badge } from '@/lib/types/badges';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BadgeItemProps {
  badge: Badge;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'w-10 h-10',
    image: 40,
  },
  md: {
    container: 'w-14 h-14',
    image: 56,
  },
  lg: {
    container: 'w-20 h-20',
    image: 80,
  },
};

export function BadgeItem({
  badge,
  earnedAt,
  size = 'md',
  showDescription = false,
  onClick,
  className,
}: BadgeItemProps) {
  const styles = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex flex-col items-center gap-1 text-center transition-transform',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        !onClick && 'cursor-default',
        className
      )}
    >
      <div className={cn('relative overflow-hidden rounded-full bg-gray-100', styles.container)}>
        {badge.image_url ? (
          <Image
            src={badge.image_url}
            alt={badge.name}
            width={styles.image}
            height={styles.image}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white'>
            <span className='text-lg font-bold'>{badge.name.charAt(0)}</span>
          </div>
        )}
      </div>
      {showDescription && (
        <div className='max-w-[80px]'>
          <p className='truncate text-xs font-medium text-gray-900'>{badge.name}</p>
        </div>
      )}
    </button>
  );
}
