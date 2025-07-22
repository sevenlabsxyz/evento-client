'use client';

import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

interface UserDetails {
  id?: string;
  username?: string;
  image?: string | null;
  verification_status?: string | 'verified' | 'pending' | null;
}

interface UserAvatarProps {
  user?: UserDetails;
  image?: string;
  fallback: string;
  verified?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  image,
  fallback,
  verified = false,
  className,
}: UserAvatarProps) {
  // Use user's image if provided through user object, otherwise use directly provided image
  const avatarImage = user?.image || image;
  const isVerified = verified || user?.verification_status === 'verified';
  
  return (
    <div className="relative">
      <Avatar className={cn('h-10 w-10', className)}>
        {avatarImage ? (
          <AvatarImage src={avatarImage} alt={fallback} />
        ) : (
          <AvatarFallback>{fallback}</AvatarFallback>
        )}
      </Avatar>
      
      {isVerified && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-white">
          <CheckCircle className="h-4 w-4 fill-blue-500 text-white" />
        </div>
      )}
    </div>
  );
}
