'use client';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SiteHeader } from '@/components/dashboard/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useWalletEventListener } from '@/lib/hooks/use-wallet-event-listener';
import { StreamChatProvider } from '@/lib/providers/stream-chat-provider';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOverlaid, applyRouteConfig } = useTopBar();
  const pathname = usePathname();
  const { hasAccess: hasBetaAccess, isLoading: isBetaLoading } = useBetaAccess();

  // Initialize wallet (singleton - manages Zustand state)
  useWallet();

  // Set up global Breez SDK event listener (runs once per session when connected)
  useWalletEventListener();

  // Simply apply any existing route configuration
  useEffect(() => {
    applyRouteConfig(pathname);
  }, [pathname, applyRouteConfig]);

  // Redirect to beta gate if no beta access
  useEffect(() => {
    if (!isBetaLoading && !hasBetaAccess) {
      router.push('/');
    }
  }, [hasBetaAccess, isBetaLoading, router]);

  // Show loading while checking beta access
  if (isBetaLoading || !hasBetaAccess) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <StreamChatProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '18rem',
            '--header-height': '3.5rem',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant='inset' />
        <SidebarInset>
          {!isOverlaid && <SiteHeader />}
          <div className='flex flex-1 flex-col'>
            <div className='flex flex-1 flex-col'>{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StreamChatProvider>
  );
}
