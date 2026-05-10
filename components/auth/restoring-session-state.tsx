'use client';

import { Loader2 } from 'lucide-react';

interface RestoringSessionStateProps {
  title?: string;
  message?: string;
}

export function RestoringSessionState({
  title = 'Restoring your session…',
  message = 'Please hang tight while we reconnect you to your account.',
}: RestoringSessionStateProps) {
  return (
    <div className='flex min-h-screen w-full items-center justify-center bg-white px-6'>
      <div className='flex max-w-sm flex-col items-center rounded-3xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm'>
        <div className='mb-4 rounded-full bg-neutral-100 p-3'>
          <Loader2 className='h-6 w-6 animate-spin text-neutral-700' />
        </div>
        <h2 className='text-base font-semibold text-neutral-900'>{title}</h2>
        <p className='mt-2 text-sm text-neutral-600'>{message}</p>
      </div>
    </div>
  );
}
