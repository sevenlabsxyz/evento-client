'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface WavlakeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}

export default function WavlakeSheet({
  isOpen,
  onClose,
  onSave,
  initialUrl = '',
}: WavlakeSheetProps) {
  const t = useTranslations('createEvent');
  const tCommon = useTranslations('common');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setError('');
    }
  }, [isOpen, initialUrl]);

  const validateUrl = (inputUrl: string) => {
    try {
      const urlObj = new URL(inputUrl);
      return urlObj.hostname === 'wavlake.com' || urlObj.hostname === 'www.wavlake.com';
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      setError(t('music.enterUrl'));
      return;
    }

    if (!validateUrl(url)) {
      setError(t('wavlake.invalidUrl'));
      return;
    }

    onSave(url);
    setUrl('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>

              {/* Header */}
              <div className='mb-6'>
                <h2 className='text-center text-xl font-semibold dark:text-neutral-100'>
                  {t('wavlake.title')}
                </h2>
              </div>

              {/* Form */}
              <div className='space-y-4'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300'>
                    {t('wavlake.urlLabel')}
                  </label>
                  <input
                    type='url'
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    placeholder='https://wavlake.com/track/... or /playlist/...'
                    className='w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500'
                    autoFocus
                  />
                  {error && <p className='mt-1 text-sm text-red-600 dark:text-red-400'>{error}</p>}
                  <p className='mt-2 text-xs text-gray-500 dark:text-neutral-400'>
                    {t('wavlake.hint')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className='mt-6 flex gap-3'>
                <button
                  onClick={handleClose}
                  className='flex-1 rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-950'
                >
                  {tCommon('actions.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className='flex-1 rounded-xl bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  {tCommon('actions.save')}
                </button>
              </div>
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
