'use client';

import {
  BookOpen,
  Calendar1,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
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
  const { state, setOpenMobile, toggleSidebar } = useSidebar();

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
