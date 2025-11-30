'use client';

import { VerificationStatus } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

type UserAvatarSize = 'xs' | 'sm' | 'base' | 'md' | 'lg';

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
  // Size variants configuration
  const sizeVariants = {
    xs: {
      avatar: 'h-4 w-4',
      border: 'border-1',
      badge: 'h-2 w-2',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-xs',
    },
    sm: {
      avatar: 'h-8 w-8',
      border: 'border-2',
      badge: 'h-4 w-4',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-sm',
    },
    base: {
      avatar: 'h-10 w-10',
      border: 'border-2',
      badge: 'h-5 w-5',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-base',
    },
    md: {
      avatar: 'h-16 w-16',
      border: 'border-2',
      badge: 'h-6 w-6',
      badgePosition: 'bottom-0 right-0',
      textSize: 'text-lg',
    },
    lg: {
      avatar: 'h-36 w-36',
      border: 'border-4',
      badge: 'h-8 w-8',
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

  return (
    <button onClick={onAvatarClick} className={cn('relative', className)}>
      <Avatar
        className={cn(
          // Only use size config if no explicit dimensions are provided
          !height && !width ? sizeConfig.avatar : '',
          sizeConfig.border,
          'border-gray-200 bg-white'
        )}
        style={height && width ? { height: `${height}px`, width: `${width}px` } : undefined}
      >
        <AvatarImage src={user?.image || '/assets/img/evento-sublogo.svg'} alt='Profile' />
        <AvatarFallback className={cn('bg-white', sizeConfig.textSize)}>
          {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      {/* Verification Badge */}
      {user?.verification_status === 'verified' && (
        <span
          role='button'
          tabIndex={0}
          aria-label='Verification badge'
          onClick={handleVerificationClick}
          className={cn('absolute transition-transform hover:scale-105', sizeConfig.badgePosition)}
        >
          <BadgeCheck
            className={cn(sizeConfig.badge, 'rounded-full bg-red-600 text-white shadow-sm')}
          />
        </span>
      )}
    </button>
  );
}
