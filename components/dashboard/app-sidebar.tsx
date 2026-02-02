'use client';

import {
  Calendar,
  HelpCircle,
  MessageCircle,
  Plus,
  Search,
  Settings,
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navMainItems = [
  {
    title: 'Events',
    url: '/',
    icon: Calendar,
  },
  {
    title: 'Saved Events',
    url: '/e/saved',
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
    title: 'Chat',
    url: '/e/messages',
    icon: MessageCircle,
  },
  {
    title: 'Settings',
    url: '/e/settings',
    icon: Settings,
  },
];

const navSecondaryItems = [
  {
    title: 'Help',
    url: 'https://evento.so/help',
    icon: HelpCircle,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleCreateEvent = () => {
    router.push('/e/create');
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible='offcanvas' className='border-r border-sidebar-border' {...props}>
      <SidebarHeader className='border-b border-sidebar-border'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:!p-1.5'>
              <Link href='/'>
                <Image
                  src='/assets/img/evento-sublogo.svg'
                  alt='Evento'
                  width={24}
                  height={24}
                  className='shrink-0'
                />
                <span className='text-base font-semibold'>Evento</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Create Event Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className='px-2 pt-2'>
              <Button onClick={handleCreateEvent} className='w-full rounded-full'>
                <Plus className='h-4 w-4' />
                Create Event
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavMain items={navMainItems} label='Menu' />

        {/* Secondary nav at the bottom */}
        <SidebarGroup className='mt-auto'>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} target='_blank' rel='noopener noreferrer'>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
