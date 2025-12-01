'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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
          <Image src='/assets/illo/mascot-duo.png' alt='Evento Mascot' width={330} height={330} />

          {/* Title & Description */}
          <div className='text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>Evento Wallet</h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              Incredibly simple, secure, and private Bitcoin wallet for modern users.
            </p>
          </div>

          {/* Buttons */}
          <div className='mt-4 w-full space-y-3'>
            <Button onClick={onSetup} className='h-12 w-full rounded-full text-base'>
              Create Wallet
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
            <Button
              onClick={onRestore}
              className='h-12 w-full rounded-full bg-gray-50 text-base'
              variant='outline'
            >
              Restore
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
