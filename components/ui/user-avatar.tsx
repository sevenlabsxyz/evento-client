'use client';

import { cn } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  user?: {
    name?: string;
    username?: string;
    image?: string | null;
    verification_status?: 'verified' | 'pending' | null | undefined;
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
      avatar: 'h-6 w-6',
      border: 'border-1',
      badge: 'h-3 w-3',
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
  return (
    <div className={cn('relative', className)}>
      <button onClick={onAvatarClick} className="relative">
        <Avatar
          className={cn(
            // Only use size config if no explicit dimensions are provided
            !height && !width ? sizeConfig.avatar : '',
            sizeConfig.border,
            'bg-white border-gray-200 shadow-lg'
          )}
          style={
            height && width
              ? { height: `${height}px`, width: `${width}px` }
              : undefined
          }
        >
          <AvatarImage
            src={user?.image || '/assets/img/evento-sublogo.svg'}
            alt="Profile"
          />
          <AvatarFallback className={cn('bg-white', sizeConfig.textSize)}>
            {user?.name?.charAt(0).toUpperCase() ||
              user?.username?.charAt(0).toUpperCase() ||
              'U'}
          </AvatarFallback>
        </Avatar>
        {/* Verification Badge */}
        {user?.verification_status === 'verified' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerificationClick?.();
            }}
            className={cn(
              'absolute transition-transform hover:scale-105',
              sizeConfig.badgePosition
            )}
          >
            <BadgeCheck
              className={cn(
                sizeConfig.badge,
                'rounded-full bg-red-600 text-white shadow-sm'
              )}
            />
          </button>
        )}
      </button>
    </div>
  );
}
