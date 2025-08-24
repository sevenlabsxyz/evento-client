'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { UserDetails } from '@/lib/types/api';
import { useCallback } from 'react';

interface ReplyAvatarProps {
  currentUser: UserDetails | null;
  onAvatarClick?: (user: UserDetails) => void;
}

/**
 * Reusable avatar component for reply sections
 * Shows the current user's avatar when they're replying
 */
export function ReplyAvatar({ currentUser, onAvatarClick }: ReplyAvatarProps) {
  const handleClick = useCallback(() => {
    if (currentUser && onAvatarClick) {
      onAvatarClick(currentUser);
    }
  }, [currentUser, onAvatarClick]);

  if (!currentUser) {
    return null;
  }

  return (
    <UserAvatar
      user={currentUser}
      size='sm'
      onAvatarClick={handleClick}
    />
  );
}