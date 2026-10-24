'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { toast } from '@/lib/utils/toast';
import { Copy, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface NostrSheetProps {
  isOpen: boolean;
  onClose: () => void;
  nip05: string;
}

export default function NostrSheet({ isOpen, onClose, nip05 }: NostrSheetProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopyNip05 = async () => {
    try {
      await navigator.clipboard.writeText(nip05);
      setCopied(true);
      toast.success(t('sheets.nostr.copiedToast'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('sheets.nostr.copyFailed'));
    }
  };

  const handleOpenNostr = () => {
    const nostrUrl = `nostr:${nip05}`;
    window.open(nostrUrl, '_blank');
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
              <h2 className='mb-6 text-center text-lg font-semibold'>Nostr</h2>

              {/* Nostr Info */}
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/60'>
                  <div className='flex h-6 w-6 items-center justify-center rounded-full bg-purple-600'>
                    <span className='text-xs font-bold text-white'>N</span>
                  </div>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                    {t('sheets.nostr.title')}
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {t('sheets.nostr.subtitle')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <p className='mb-4 text-gray-600 dark:text-neutral-400'>
                  {t('sheets.nostr.description')}
                </p>
                <div className='rounded-lg bg-gray-50 p-3 dark:bg-neutral-950'>
                  <p className='break-all font-mono text-sm text-gray-700 dark:text-neutral-300'>
                    {nip05}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleOpenNostr}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  {t('sheets.nostr.openApp')}
                </Button>
                <Button onClick={handleCopyNip05} className='w-full' variant='outline'>
                  <Copy className='mr-2 h-4 w-4' />
                  {copied ? t('copiedBang') : t('sheets.nostr.copy')}
                </Button>
              </div>

              <Button variant='outline' onClick={onClose} className='mt-3 w-full'>
                {tCommon('actions.close')}
              </Button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
