'use client';

import { VerificationStatus } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

type UserAvatarSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';

const DEFAULT_AVATAR_IMAGE = '/assets/img/evento-sublogo.svg';

interface UserAvatarProps {
  user?: {
    name?: string;
    username?: string;
    image?: string | null;
    verification_status?: VerificationStatus;
  };
  onAvatarClick?: () => void;
  onVerificationClick?: () => void;
  className?: string;
  size?: UserAvatarSize;
  height?: number;
  width?: number;
}

export function UserAvatar({
  user,
  onAvatarClick,
  onVerificationClick,
  className,
  size = 'md',
  height,
  width,
}: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState(user?.image || DEFAULT_AVATAR_IMAGE);

  useEffect(() => {
    setAvatarSrc(user?.image || DEFAULT_AVATAR_IMAGE);
  }, [user?.image]);

  // Size variants configuration
  const sizeVariants = {
    xs: {
      avatar: 'h-5 w-5',
      border: 'border-1',
      badge: 'h-2 w-2',
      badgeIcon: 'h-1 w-1',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-xs',
    },
    sm: {
      avatar: 'h-8 w-8',
      border: 'border-2',
      badge: 'h-4 w-4',
      badgeIcon: 'h-2.5 w-2.5',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-sm',
    },
    base: {
      avatar: 'h-10 w-10',
      border: 'border-2',
      badge: 'h-5 w-5',
      badgeIcon: 'h-3 w-3',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-base',
    },
    md: {
      avatar: 'h-16 w-16',
      border: 'border-2',
      badge: 'h-6 w-6',
      badgeIcon: 'h-3.5 w-3.5',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-lg',
    },
    lg: {
      avatar: 'h-36 w-36',
      border: 'border-4',
      badge: 'h-8 w-8',
      badgeIcon: 'h-5 w-5',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-3xl',
    },
  };

  // Get the current size configuration
  const sizeConfig = sizeVariants[size];

  const handleVerificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVerificationClick?.();
  };

  const avatar = (
    <Avatar
      className={cn(
        !height && !width ? sizeConfig.avatar : '',
        sizeConfig.border,
        'border-gray-200 bg-white'
      )}
      style={height && width ? { height: `${height}px`, width: `${width}px` } : undefined}
    >
      <AvatarImage
        src={avatarSrc}
        alt='Profile'
        onError={() => {
          if (avatarSrc !== DEFAULT_AVATAR_IMAGE) {
            setAvatarSrc(DEFAULT_AVATAR_IMAGE);
          }
        }}
      />
      <AvatarFallback className={cn('bg-white', sizeConfig.textSize)}>
        <img
          src={DEFAULT_AVATAR_IMAGE}
          alt='Default profile'
          className='h-full w-full object-cover'
        />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn('relative', className)}>
      {onAvatarClick ? (
        <button type='button' onClick={onAvatarClick}>
          {avatar}
        </button>
      ) : (
        avatar
      )}
      {/* Verification Badge */}
      {user?.verification_status === 'verified' &&
        (onVerificationClick ? (
          <button
            type='button'
            aria-label='Verification badge'
            onClick={handleVerificationClick}
            className={cn(
              'absolute flex scale-90 items-center justify-center rounded-full border-2 border-gray-200 bg-red-600',
              sizeConfig.badge,
              sizeConfig.badgePosition,
              'transition-transform hover:scale-105'
            )}
          >
            <Check className={cn(sizeConfig.badgeIcon, 'stroke-[3] text-white')} />
          </button>
        ) : (
          <span
            aria-hidden='true'
            className={cn(
              'absolute flex scale-90 items-center justify-center rounded-full border-2 border-gray-200 bg-red-600',
              sizeConfig.badge,
              sizeConfig.badgePosition
            )}
          >
            <Check className={cn(sizeConfig.badgeIcon, 'stroke-[3] text-white')} />
          </span>
        ))}
    </div>
  );
}
