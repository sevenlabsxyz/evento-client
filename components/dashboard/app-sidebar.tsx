'use client';

import {
  Calendar1,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavUser } from '@/components/dashboard/nav-user';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useRightSidebar } from '@/lib/stores/right-sidebar-store';

const navMain = [
  {
    title: 'Events',
    url: '/e/hub',
    icon: Calendar1,
  },
  {
    title: 'Lists',
    url: '/e/lists',
    icon: Star,
  },
  {
    title: 'Search',
    url: '/e/search',
    icon: Search,
  },
  {
    title: 'Wallet',
    url: '/e/wallet',
    icon: Zap,
  },
  {
    title: 'Messages',
    url: '/e/messages',
    icon: MessageCircle,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const { isOpen: isCalendarOpen, toggle: toggleCalendar } = useRightSidebar();

  const handleCreateEvent = () => {
    router.push('/e/create');
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <Link href='/e/hub' className='relative flex h-8 items-center p-2'>
          {/* Full logo — fades out when sidebar collapses */}
          <Image
            src='/assets/img/evento-logo.svg'
            alt='Evento'
            width={120}
            height={17}
            className='h-auto w-[120px] transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 dark:invert'
          />
          {/* Sub logo (asterisk) — fades in when sidebar collapses, pinned to left */}
          <Image
            src='/assets/img/evento-sublogo.svg'
            alt='Evento'
            width={28}
            height={28}
            className='absolute left-0.5 top-1/2 size-7 -translate-y-1/2 opacity-0 transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-100 dark:invert'
          />
        </Link>
        {/* Expanded: full black Button — fades out as sidebar collapses */}
        <div className='mt-4 px-2 transition-opacity duration-200 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:opacity-0'>
          <Button onClick={handleCreateEvent} className='w-full'>
            <Plus className='h-4 w-4' />
            Create Event
          </Button>
        </div>
        {/* Collapsed: icon-only dark SidebarMenuButton — fades in as sidebar collapses */}
        <SidebarMenu className='pointer-events-none h-0 overflow-hidden opacity-0 transition-opacity duration-200 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:opacity-100'>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip='Create Event'
              onClick={handleCreateEvent}
              className='rounded-full bg-black text-white hover:bg-black/90 hover:text-white active:bg-black/80 group-data-[collapsible=icon]:!rounded-full'
            >
              <Plus />
              <span>Create Event</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isCalendarOpen ? 'Hide Calendar' : 'Show Calendar'}
              onClick={toggleCalendar}
            >
              {isCalendarOpen ? <PanelRightClose /> : <PanelRightOpen />}
              <span>{isCalendarOpen ? 'Hide Calendar' : 'Show Calendar'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={state === 'expanded' ? 'Hide Sidebar' : 'Show Sidebar'}
              onClick={toggleSidebar}
            >
              {state === 'expanded' ? <PanelRightOpen /> : <PanelRightClose />}
              <span>{state === 'expanded' ? 'Hide Sidebar' : 'Show Sidebar'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
