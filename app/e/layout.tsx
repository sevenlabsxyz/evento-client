'use client';

import { TopBar } from '@/components/top-bar';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useWalletEventListener } from '@/lib/hooks/use-wallet-event-listener';
import { StreamChatProvider } from '@/lib/providers/stream-chat-provider';
import { useTopBar } from '@/lib/stores/topbar-store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { isOverlaid, applyRouteConfig } = useTopBar();
  const pathname = usePathname();

  // Initialize wallet (singleton - manages Zustand state)
  useWallet();

  // Set up global Breez SDK event listener (runs once per session when connected)
  useWalletEventListener();

  // Simply apply any existing route configuration
  useEffect(() => {
    applyRouteConfig(pathname);
  }, [pathname, applyRouteConfig]);

  return (
    <StreamChatProvider>
      <TopBar />
      <div className={`${isOverlaid ? '' : 'pt-16 md:pt-2'} md:ml-[280px]`}>{children}</div>
    </StreamChatProvider>
  );
}
