'use client';

import { Button } from '@/components/ui/button';
import { designTokens } from '@/lib/design-tokens/colors';
import { MessageCircle, UserMinus, UserPlus, Zap } from 'lucide-react';
import { useCallback } from 'react';

interface ProfileActionsProps {
  isFollowing: boolean;
  isLoading: boolean;
  isPending: boolean;
  hasLightningAddress: boolean;
  onFollowToggle: () => void;
  onMessage: () => void;
  onTip: () => void;
}

export function ProfileActions({
  isFollowing,
  isLoading,
  isPending,
  hasLightningAddress,
  onFollowToggle,
  onMessage,
  onTip,
}: ProfileActionsProps) {
  const handleFollowClick = useCallback(() => {
    onFollowToggle();
  }, [onFollowToggle]);

  const handleMessageClick = useCallback(() => {
    onMessage();
  }, [onMessage]);

  const handleTipClick = useCallback(() => {
    onTip();
  }, [onTip]);

  return (
    <div className='mb-3 flex gap-2'>
      <Button
        onClick={handleFollowClick}
        disabled={isLoading || isPending}
        className={`flex-1 rounded-xl ${
          isFollowing
            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
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
        variant='outline'
        onClick={handleMessageClick}
        className='rounded-xl bg-transparent px-4'
      >
        <MessageCircle className='mr-2 h-4 w-4' />
        Message
      </Button>
      {hasLightningAddress && (
        <Button
          variant='outline'
          onClick={handleTipClick}
          className='group rounded-xl bg-transparent px-4 transition-colors hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700'
        >
          <Zap className='mr-2 h-4 w-4 text-black transition-colors group-hover:text-orange-700' />
          Tip
        </Button>
      )}
    </div>
  );
}
