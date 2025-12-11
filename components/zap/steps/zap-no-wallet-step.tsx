'use client';

import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface ZapNoWalletStepProps {
  onClose: () => void;
}

export function ZapNoWalletStep({ onClose }: ZapNoWalletStepProps) {
  return (
    <div className='flex flex-col items-center justify-center p-12 text-center'>
      <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
        <Zap className='h-8 w-8 text-gray-400' />
      </div>
      <h3 className='mb-2 text-xl font-semibold text-gray-900'>Wallet Not Set Up</h3>
      <p className='mb-8 text-gray-600'>
        This user hasn&apos;t set up their Evento wallet yet. We&apos;ve let them know!
      </p>
      <Button
        onClick={onClose}
        className='h-12 w-full max-w-xs rounded-full bg-gray-900 font-semibold text-white hover:bg-gray-800'
      >
        Done
      </Button>
    </div>
  );
}
