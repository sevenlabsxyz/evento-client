'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { ExternalLink, Globe } from 'lucide-react';

interface WebsiteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function WebsiteSheet({ isOpen, onClose, url }: WebsiteSheetProps) {
  const handleOpenWebsite = () => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
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
              <h2 className='mb-6 text-center text-lg font-semibold'>Website</h2>

              {/* Website Info */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
                  <Globe className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>{getDomainFromUrl(url)}</h3>
                  <p className='text-sm text-gray-500'>External website</p>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='mb-4 text-gray-600'>
                  You're about to visit an external website. This will open in a new tab.
                </p>
                <div className='rounded-lg bg-gray-50 p-3'>
                  <p className='break-all text-sm text-gray-700'>{url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleOpenWebsite}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  Open Website
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
