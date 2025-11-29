'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface WalletWelcomeProps {
  onSetup: () => void;
  onRestore: () => void;
}

export function WalletWelcome({ onSetup, onRestore }: WalletWelcomeProps) {
  return (
    <div className='relative flex min-h-[calc(100vh-8rem)] flex-col'>
      <div className='mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6'>
        <div className='flex w-full flex-col items-center gap-8'>
          {/* Mascot Image */}
          <Image src='/assets/illo/mascot-duo.png' alt='Evento Mascot' width={280} height={280} />

          {/* Title & Description */}
          <div className='text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>Evento Wallet</h1>
            <p className='mt-2 text-sm text-muted-foreground'>Your keys, your coins</p>
          </div>

          {/* Buttons */}
          <div className='mt-4 w-full space-y-3'>
            <Button onClick={onSetup} className='h-12 w-full rounded-full text-base'>
              Continue
            </Button>
            <Button
              onClick={onRestore}
              className='h-12 w-full rounded-full text-base'
              variant='outline'
            >
              Recover
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='pb-8 pt-4 text-center'>
        <p className='text-xs text-muted-foreground'>Powered by Breez</p>
      </div>
    </div>
  );
}
