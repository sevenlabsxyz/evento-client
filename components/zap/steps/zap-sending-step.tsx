'use client';

import { Loader2 } from 'lucide-react';

export function ZapSendingStep() {
  return (
    <div className='flex flex-col items-center justify-center p-12'>
      <Loader2 className='h-16 w-16 animate-spin text-red-500' />
      <p className='mt-6 text-xl font-semibold text-gray-900'>Sending Zap...</p>
      <p className='mt-2 text-sm text-gray-500'>Please wait</p>
    </div>
  );
}
