'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { safeExternalUrl } from '@/lib/utils/url';
import { ExternalLink, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WebsiteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function WebsiteSheet({ isOpen, onClose, url }: WebsiteSheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const handleOpenWebsite = () => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(safeExternalUrl(fullUrl), '_blank', 'noopener,noreferrer');
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
              <h2 className='mb-6 text-center text-lg font-semibold'>
                {t('sheets.website.title')}
              </h2>

              {/* Website Info */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60'>
                  <Globe className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                    {getDomainFromUrl(url)}
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {t('sheets.website.subtitle')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='mb-4 text-gray-600 dark:text-neutral-400'>
                  {t('sheets.website.description')}
                </p>
                <div className='rounded-lg bg-gray-50 p-3 dark:bg-neutral-950'>
                  <p className='break-all text-sm text-gray-700 dark:text-neutral-300'>{url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleOpenWebsite}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  {t('sheets.website.open')}
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
