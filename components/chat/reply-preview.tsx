'use client';

import { Reply, X } from 'lucide-react';
import type { MessageResponse } from 'stream-chat';

interface ReplyPreviewProps {
  replyingTo: MessageResponse;
  onCancel: () => void;
}

export function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  return (
    <div className='border-b bg-gray-50 p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-xs text-gray-600'>
          <Reply className='h-3 w-3' />
          <span>Replying to {replyingTo.user?.name || replyingTo.user?.id || 'User'}</span>
        </div>
        <button onClick={onCancel} className='text-gray-400 transition-colors hover:text-gray-600'>
          <X className='h-3 w-3' />
        </button>
      </div>
      <div className='mt-1 truncate text-xs text-gray-500'>
        {replyingTo.text || 'Message with attachments'}
      </div>
    </div>
  );
}
