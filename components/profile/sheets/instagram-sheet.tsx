'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { ExternalLink, Instagram } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InstagramSheetProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
}

export default function InstagramSheet({ isOpen, onClose, handle }: InstagramSheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const handleOpenInstagram = () => {
    const instagramUrl = `https://instagram.com/${handle}`;
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
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
              <h2 className='mb-6 text-center text-lg font-semibold'>Instagram</h2>

              {/* Instagram Info */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'>
                  <Instagram className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>@{handle}</h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {t('sheets.instagram.subtitle')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='mb-4 text-gray-600 dark:text-neutral-400'>
                  {t('sheets.instagram.description')}
                </p>
                <div className='rounded-lg bg-gray-50 p-3 dark:bg-neutral-950'>
                  <p className='text-sm text-gray-700 dark:text-neutral-300'>
                    instagram.com/{handle}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleOpenInstagram}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  {t('sheets.instagram.open')}
                </Button>
                <Button variant='outline' onClick={onClose} className='w-full'>
                  {tCommon('actions.cancel')}
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
