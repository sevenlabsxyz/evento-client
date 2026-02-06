'use client';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SiteHeader } from '@/components/dashboard/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useWalletEventListener } from '@/lib/hooks/use-wallet-event-listener';
import { StreamChatProvider } from '@/lib/providers/stream-chat-provider';
import { useTopBar } from '@/lib/stores/topbar-store';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { isOverlaid, applyRouteConfig } = useTopBar();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  useWallet();
  useWalletEventListener();

  useEffect(() => {
    applyRouteConfig(pathname);
  }, [pathname, applyRouteConfig]);

  return (
    <StreamChatProvider>
      <SidebarProvider
        defaultOpen={isAuthenticated}
        open={isAuthenticated ? undefined : false}
        style={
          {
            '--sidebar-width': '18rem',
            '--header-height': '3.5rem',
          } as React.CSSProperties
        }
      >
        {isAuthenticated && <AppSidebar variant='inset' />}
        <SidebarInset className='max-h-svh md:max-h-[calc(100svh-1rem)]'>
          {!isOverlaid && <SiteHeader />}
          <div className='flex-1 overflow-auto'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </StreamChatProvider>
  );
}
