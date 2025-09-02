'use client';

import { Button } from '@/components/ui/button';
import { Pin, PinOff } from 'lucide-react';
import type { MessageResponse } from 'stream-chat';

interface PinnedMessageBannerProps {
  pinnedMessage: MessageResponse;
  pinnedCount: number;
  currentIndex: number;
  onUnpin: () => void;
  onNext: () => void;
}

export function PinnedMessageBanner({
  pinnedMessage,
  pinnedCount,
  currentIndex,
  onUnpin,
  onNext,
}: PinnedMessageBannerProps) {
  return (
    <div
      className='cursor-pointer border-b bg-blue-50 px-4 py-2 transition-colors hover:bg-blue-100'
      onClick={pinnedCount > 1 ? onNext : undefined}
    >
      <div className='flex items-center gap-2'>
        <Pin className='h-4 w-4 text-blue-600' />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 text-xs font-medium text-blue-600'>
            <span>Pinned Message</span>
            {pinnedCount > 1 && (
              <span className='rounded-full bg-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-800'>
                {currentIndex + 1} of {pinnedCount}
              </span>
            )}
          </div>
          <div className='truncate text-sm text-gray-700'>
            {pinnedMessage?.text || 'Message with attachments'}
          </div>
          {pinnedCount > 1 && (
            <div className='mt-1 text-xs text-blue-500'>Click to see next pinned message</div>
          )}
        </div>
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            className='h-6 w-6 p-0 text-blue-600 hover:text-blue-700'
            title='Unpin Message'
          >
            <PinOff className='h-3 w-3' />
          </Button>
        </div>
      </div>
    </div>
  );
}
