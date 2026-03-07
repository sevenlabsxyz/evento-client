'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getManageEventOptions } from '@/lib/constants/manage-event-options';
import { useRightSidebar } from '@/lib/stores/right-sidebar-store';
import { ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function SidebarRight() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, panel, manageEventContext, close, openManageEventMenu } = useRightSidebar();
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');

    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  const manageOptions = useMemo(() => {
    if (!manageEventContext) return [];

    return getManageEventOptions({
      eventId: manageEventContext.eventId,
      eventType: manageEventContext.eventType,
      eventStatus: manageEventContext.eventStatus,
    });
  }, [manageEventContext]);

  const scopedEventMatch = pathname.match(/^\/e\/([^/]+)(?:\/manage(?:\/.*)?|$)/);
  const scopedEventId = scopedEventMatch?.[1] ?? null;
  const manageRouteMatch = pathname.match(/^\/e\/([^/]+)\/manage(?:\/.*)?$/);
  const manageRouteEventId = manageRouteMatch?.[1] ?? null;
  const hasScopedEventContext =
    !!scopedEventId && !!manageEventContext && manageEventContext.eventId === scopedEventId;

  const showManageMenu = panel === 'manage-event-menu' && hasScopedEventContext;
  const state = isOpen && showManageMenu ? 'expanded' : 'collapsed';

  useEffect(() => {
    if (isMobileViewport || !manageRouteEventId) return;

    const isManageContextReady =
      isOpen && panel === 'manage-event-menu' && manageEventContext?.eventId === manageRouteEventId;

    if (isManageContextReady) return;

    openManageEventMenu({
      eventId: manageRouteEventId,
      eventType:
        manageEventContext?.eventId === manageRouteEventId
          ? (manageEventContext.eventType ?? undefined)
          : undefined,
      eventStatus:
        manageEventContext?.eventId === manageRouteEventId
          ? (manageEventContext.eventStatus ?? undefined)
          : undefined,
    });
  }, [
    isMobileViewport,
    manageRouteEventId,
    isOpen,
    panel,
    manageEventContext,
    openManageEventMenu,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    if (!isMobileViewport && manageRouteEventId) return;

    if (!showManageMenu) {
      close();
    }
  }, [isOpen, isMobileViewport, manageRouteEventId, showManageMenu, close]);

  const mobileSheetOpen = isMobileViewport && isOpen && showManageMenu;
  const menuItems = showManageMenu ? (
    <SidebarMenu>
      {manageOptions.map((option) => {
        const Icon = option.icon;
        const isActive = pathname === option.route || pathname.startsWith(`${option.route}/`);

        return (
          <SidebarMenuItem key={option.id}>
            <SidebarMenuButton
              tooltip={option.title}
              isActive={isActive}
              onClick={() => {
                router.push(option.route);
                close();
              }}
              className='h-10'
            >
              <Icon className='h-4 w-4 text-sidebar-foreground' />
              <span>{option.title}</span>
              <ChevronRight className='ml-auto h-4 w-4 text-sidebar-foreground/60' />
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  ) : null;

  return (
    <>
      <Sheet open={mobileSheetOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent
          side='right'
          className='w-[18rem] max-w-[85vw] border-l border-sidebar-border bg-sidebar p-0 text-sidebar-foreground'
        >
          <SheetHeader className='h-16 justify-center border-b border-sidebar-border px-2 py-0 text-left'>
            <SheetTitle className='px-2 text-sm font-medium text-sidebar-foreground'>
              Manage Event
            </SheetTitle>
          </SheetHeader>
          <SidebarContent className='p-2'>{menuItems}</SidebarContent>
        </SheetContent>
      </Sheet>

      <div
        className='group hidden text-sidebar-foreground lg:block'
        data-state={state}
        data-collapsible={state === 'collapsed' ? 'offcanvas' : ''}
        data-side='right'
      >
        {/* Gap div — in flow, transitions width to push/release content */}
        <div className='relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0' />

        {/* Panel — fixed, transitions right position to slide in/out */}
        <div className='fixed inset-y-0 right-0 z-10 hidden h-svh w-[--sidebar-width] bg-sidebar transition-[right] duration-200 ease-linear group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] lg:flex'>
          <div className='flex h-full w-full flex-col'>
            <SidebarHeader className='h-16 justify-center border-b border-sidebar-border'>
              <span className='px-2 text-sm font-medium'>Manage Event</span>
            </SidebarHeader>
            <SidebarContent className='p-2'>{menuItems}</SidebarContent>
          </div>
        </div>
      </div>
    </>
  );
}
