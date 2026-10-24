'use client';

import { SpotifySVGImage } from '@/components/icons/spotify';
import { WavlakeSVGImage } from '@/components/icons/wavlake';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import SpotifySheet from './spotify-sheet';
import WavlakeSheet from './wavlake-sheet';

interface AttachmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAttachment?: (type: string, url: string) => void;
  spotifyUrl?: string;
  wavlakeUrl?: string;
}

export default function AttachmentSheet({
  isOpen,
  onClose,
  onSaveAttachment,
  spotifyUrl = '',
  wavlakeUrl = '',
}: AttachmentSheetProps) {
  const t = useTranslations('createEvent');
  const [showSpotifySheet, setShowSpotifySheet] = useState(false);
  const [showWavlakeSheet, setShowWavlakeSheet] = useState(false);

  const hasSpotify = !!spotifyUrl;
  const hasWavlake = !!wavlakeUrl;

  const handleSpotifyClick = () => {
    setShowSpotifySheet(true);
  };

  const handleWavlakeClick = () => {
    setShowWavlakeSheet(true);
  };

  const handleSpotifySave = (url: string) => {
    if (onSaveAttachment) {
      onSaveAttachment('spotify', url);
    }
    setShowSpotifySheet(false);
  };

  const handleWavlakeSave = (url: string) => {
    if (onSaveAttachment) {
      onSaveAttachment('wavlake', url);
    }
    setShowWavlakeSheet(false);
  };

  const options = [
    {
      type: 'spotify' as const,
      label: hasSpotify ? t('attachment.editSpotify') : t('attachment.addSpotify'),
      icon: <SpotifySVGImage className='h-6 w-6' />,
      description: hasSpotify
        ? t('attachment.modifySpotifyDescription')
        : t('attachment.addSpotifyDescription'),
      filled: hasSpotify,
      disabled: false,
      onClick: handleSpotifyClick,
    },
    {
      type: 'wavlake' as const,
      label: hasWavlake ? t('attachment.editWavlake') : t('attachment.addWavlake'),
      icon: <WavlakeSVGImage className='h-6 w-6 dark:fill-white' />,
      description: hasWavlake
        ? t('attachment.modifyWavlakeDescription')
        : t('attachment.addWavlakeDescription'),
      filled: hasWavlake,
      disabled: false,
      onClick: handleWavlakeClick,
    },
  ];

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
      forComponent='closest'
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

              {/* Header */}
              <div className='mb-6'>
                <h2 className='text-center text-xl font-semibold'>{t('attachment.title')}</h2>
              </div>

              {/* Options */}
              <div className='space-y-3'>
                {options.map((option) => {
                  const getButtonStyles = () => {
                    if (option.disabled) {
                      return 'w-full p-4 bg-gray-200 dark:bg-neutral-700 rounded-2xl flex items-center gap-4 text-left cursor-not-allowed opacity-50';
                    }
                    if (option.filled) {
                      return 'w-full p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 hover:bg-green-100 dark:hover:bg-green-950/60 rounded-2xl flex items-center gap-4 text-left transition-colors';
                    }
                    return 'w-full p-4 bg-gray-50 dark:bg-neutral-950 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-2xl flex items-center gap-4 text-left transition-colors';
                  };

                  const getIconStyles = () => {
                    if (option.disabled) {
                      return 'w-12 h-12 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center text-gray-500 dark:text-neutral-400';
                    }
                    if (option.filled) {
                      return 'w-12 h-12 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center text-green-700 dark:text-green-400';
                    }
                    return 'w-12 h-12 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center text-gray-600 dark:text-neutral-400';
                  };

                  const getTextStyles = () => {
                    if (option.disabled) {
                      return {
                        label: 'font-medium text-gray-500 dark:text-neutral-400',
                        description: 'text-sm text-gray-400 dark:text-neutral-500',
                      };
                    }
                    if (option.filled) {
                      return {
                        label: 'font-medium text-green-900 dark:text-green-400',
                        description: 'text-sm text-green-700 dark:text-green-400',
                      };
                    }
                    return {
                      label: 'font-medium text-gray-900 dark:text-neutral-100',
                      description: 'text-sm text-gray-500 dark:text-neutral-400',
                    };
                  };

                  const textStyles = getTextStyles();

                  return (
                    <button
                      key={option.type}
                      onClick={option.onClick}
                      className={getButtonStyles()}
                      disabled={option.disabled}
                    >
                      <div className={getIconStyles()}>{option.icon}</div>
                      <div className='flex-1'>
                        <p className={textStyles.label}>{option.label}</p>
                        <p className={textStyles.description}>{option.description}</p>
                      </div>
                      {option.filled && (
                        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
                          <Check className='h-4 w-4 text-white' />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nested Sheets */}
            <SpotifySheet
              isOpen={showSpotifySheet}
              onClose={() => setShowSpotifySheet(false)}
              onSave={handleSpotifySave}
              initialUrl={spotifyUrl}
            />
            <WavlakeSheet
              isOpen={showWavlakeSheet}
              onClose={() => setShowWavlakeSheet(false)}
              onSave={handleWavlakeSave}
              initialUrl={wavlakeUrl}
            />
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
