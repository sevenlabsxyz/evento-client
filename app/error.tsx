'use client';

import { Button } from '@/components/ui/button';
import { reportErrorAlert } from '@/lib/observability/error-alert-client';
import { useEffect, useRef } from 'react';
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Guard to prevent resending the same error on rerender
  const reportedRef = useRef<Error | null>(null);

  useEffect(() => {
    // Only report if this is a new error object
    if (reportedRef.current !== error) {
      reportedRef.current = error;
      reportErrorAlert({
        kind: 'browser-error',
        message: error.message,
        stack: error.stack,
        path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      });
    }
  }, [error]);

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
