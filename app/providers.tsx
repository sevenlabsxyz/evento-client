'use client';

import { Sidebar } from '@/components/silk/Sidebar';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import WebViewProvider from '@/components/web-view/web-view-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebViewProvider>
        {children}
        <Sidebar />
        <ReactQueryDevtools initialIsOpen={false} />
      </WebViewProvider>
    </QueryClientProvider>
  );
}
