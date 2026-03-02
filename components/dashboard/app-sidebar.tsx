'use client';

import {
  BookOpen,
  Calendar1,
  MessageCircle,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Star,
  UserCircle2,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavSecondary } from '@/components/dashboard/nav-secondary';
import { NavUser } from '@/components/dashboard/nav-user';
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

const navSecondary = [
  {
    title: 'Profile',
    url: '/e/profile',
    icon: UserCircle2,
  },
  {
    title: 'Settings',
    url: '/e/settings',
    icon: Settings,
  },
  {
    title: 'Blog',
    url: '/e/blog',
    icon: BookOpen,
  },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();

  const handleCreateEvent = () => {
    router.push('/e/create');
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:!p-1.5'>
              <Link href='/e/hub'>
                <Image
                  src='/assets/img/evento-sublogo.svg'
                  alt='Evento'
                  width={24}
                  height={24}
                  className='!size-6'
                />
                <span className='text-base font-semibold'>Evento</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip='Create Event' onClick={handleCreateEvent}>
              <Plus />
              <span>Create Event</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip='Toggle Sidebar' onClick={toggleSidebar}>
              <PanelLeft />
              <span>Toggle Sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
