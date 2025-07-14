'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { Sidebar } from '@/components/silk/Sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Sidebar />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}