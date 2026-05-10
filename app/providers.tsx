'use client';

import { ErrorAlertListeners } from '@/components/observability/error-alert-listeners';
import { AuthRecoveryProvider } from '@/lib/providers/auth-recovery-provider';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRecoveryProvider>
        <ErrorAlertListeners />
        {children}
      </AuthRecoveryProvider>
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
