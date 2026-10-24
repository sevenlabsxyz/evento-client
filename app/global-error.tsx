'use client';

import { LOCALE_COOKIE, matchLocale, type AppLocale } from '@/i18n/config';
import { reportErrorAlert } from '@/lib/observability/error-alert-client';
import { useEffect, useRef } from 'react';

/**
 * The global error boundary replaces the root layout, so no NextIntlClientProvider
 * is available here; this mirrors `misc.error` in messages/{locale}/misc.json.
 */
const GLOBAL_ERROR_COPY: Record<
  AppLocale,
  { title: string; description: string; tryAgain: string }
> = {
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    tryAgain: 'Try again',
  },
  'pt-BR': {
    title: 'Algo deu errado',
    description: 'Ocorreu um erro inesperado. Tente novamente.',
    tryAgain: 'Tentar novamente',
  },
  es: {
    title: 'Algo salió mal',
    description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    tryAgain: 'Intentar de nuevo',
  },
};

function detectLocale(): AppLocale {
  if (typeof document === 'undefined') return 'en';
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];
  return matchLocale(cookie ? decodeURIComponent(cookie) : navigator.language) ?? 'en';
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Guard to prevent resending the same error on rerender
  const reportedRef = useRef<Error | null>(null);
  const locale = detectLocale();
  const copy = GLOBAL_ERROR_COPY[locale];

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
    <html lang={locale}>
      <body>
        <style>{`
          :root { color-scheme: light dark; }
          @media (prefers-color-scheme: dark) {
            body { background-color: #0a0a0a; color: #f5f5f5; }
            p { color: #a3a3a3 !important; }
            button { background-color: #f5f5f5 !important; color: #171717 !important; }
          }
        `}</style>
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
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>{copy.title}</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            {copy.description}
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
            {copy.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
