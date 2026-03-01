'use client';

import {
  BookOpen,
  Calendar1,
  MessageCircle,
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
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  const { setOpenMobile } = useSidebar();

  const handleCreateEvent = () => {
    router.push('/e/create');
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible='offcanvas' {...props}>
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
        <Button onClick={handleCreateEvent} className='mt-2 w-full'>
          <Plus className='mr-2 h-4 w-4' />
          Create Event
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
