'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center p-6 text-center'>
      <h2 className='mb-2 text-lg font-semibold'>Something went wrong</h2>
      <p className='mb-4 text-sm text-muted-foreground'>
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => reset()} variant='default'>
        Try again
      </Button>
    </div>
  );
}
