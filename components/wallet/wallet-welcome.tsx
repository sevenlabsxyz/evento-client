'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface WalletWelcomeProps {
  onSetup: () => void;
  onRestore: () => void;
}

export function WalletWelcome({ onSetup, onRestore }: WalletWelcomeProps) {
  const t = useTranslations('wallet');
  return (
    <div className='relative flex min-h-[calc(100vh-8rem)] flex-col md:min-h-0'>
      <div className='mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 md:px-0'>
        <div className='flex w-full flex-col items-center gap-8'>
          {/* Mascot Image */}
          <Image
            src='/assets/illo/mascot-duo.png'
            alt={t('welcome.mascotAlt')}
            width={330}
            height={330}
            className='md:h-auto md:w-60'
          />

          {/* Title & Description */}
          <div className='text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>{t('welcome.title')}</h1>
            <p className='mt-2 text-sm text-muted-foreground'>{t('welcome.description')}</p>
          </div>

          {/* Buttons */}
          <div className='mt-4 w-full space-y-3'>
            <Button onClick={onSetup} className='h-12 w-full rounded-full text-base'>
              {t('welcome.createWallet')}
              <ArrowRight className='h-4 w-4' />
            </Button>
            <Button
              onClick={onRestore}
              className='h-12 w-full rounded-full bg-gray-50 text-base dark:bg-neutral-900'
              variant='outline'
            >
              {t('welcome.haveWallet')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
