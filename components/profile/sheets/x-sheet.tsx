'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { ExternalLink } from 'lucide-react';

interface XSheetProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
}

export default function XSheet({ isOpen, onClose, handle }: XSheetProps) {
  const handleOpenX = () => {
    const xUrl = `https://x.com/${handle}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Title */}
              <h2 className='mb-6 text-center text-lg font-semibold'>X (Twitter)</h2>

              {/* X Info */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-black'>
                  <svg className='h-6 w-6 text-white' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>@{handle}</h3>
                  <p className='text-sm text-gray-500'>X (Twitter) profile</p>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='mb-4 text-gray-600'>
                  You&apos;re about to visit this X (Twitter) profile. This will open in a new tab.
                </p>
                <div className='rounded-lg bg-gray-50 p-3'>
                  <p className='text-sm text-gray-700'>x.com/{handle}</p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleOpenX}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  Open X Profile
                </Button>
                <Button variant='outline' onClick={onClose} className='w-full'>
                  Cancel
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
