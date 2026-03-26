'use client';

import { reportErrorAlert } from '@/lib/observability/error-alert-client';
import { useEffect, useRef } from 'react';
export default function GlobalError({
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
    <html lang='en'>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
