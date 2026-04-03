'use client';

import { Button } from '@/components/ui/button';
import { designTokens } from '@/lib/design-tokens/colors';
import { Loader2, MessageCircle, UserMinus, UserPlus } from 'lucide-react';
import { useCallback } from 'react';

interface ProfileActionsProps {
  isFollowing: boolean;
  isLoading: boolean;
  isPending: boolean;
  isMessaging: boolean;
  isMessageDisabled: boolean;
  onFollowToggle: () => void;
  onMessage: () => void;
}

export function ProfileActions({
  isFollowing,
  isLoading,
  isPending,
  isMessaging,
  isMessageDisabled,
  onFollowToggle,
  onMessage,
}: ProfileActionsProps) {
  const handleFollowClick = useCallback(() => {
    onFollowToggle();
  }, [onFollowToggle]);

  const handleMessageClick = useCallback(() => {
    onMessage();
  }, [onMessage]);

  return (
    <div className='mb-3 flex gap-2'>
      <Button
        onClick={handleFollowClick}
        disabled={isLoading || isPending}
        className={`h-12 flex-1 rounded-full border border-gray-200 ${
          isFollowing
            ? 'bg-gray-50 text-gray-900 hover:bg-gray-100'
            : `${designTokens.colors.gradients.primaryButton} text-white`
        }`}
      >
        {isFollowing ? (
          <>
            <UserMinus className='mr-2 h-4 w-4' />
            {isPending ? 'Unfollowing...' : 'Following'}
          </>
        ) : (
          <>
            <UserPlus className='mr-2 h-4 w-4' />
            {isPending ? 'Following...' : 'Follow'}
          </>
        )}
      </Button>
      <Button
        onClick={handleMessageClick}
        disabled={isMessageDisabled}
        className='h-12 flex-1 rounded-full border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'
      >
        {isMessaging ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Starting...
          </>
        ) : (
          <>
            <MessageCircle className='mr-2 h-4 w-4' />
            Message
          </>
        )}
      </Button>
    </div>
  );
}
