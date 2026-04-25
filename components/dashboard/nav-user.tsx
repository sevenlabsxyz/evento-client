'use client';

import {
  BookOpen01Icon,
  BotIcon,
  CodeIcon,
  Logout02Icon,
  MoreVerticalIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';

import Link from 'next/link';
import { useState } from 'react';

import { SidebarIcon } from '@/components/dashboard/sidebar-icon';
import { LogoutConfirmationSheet } from '@/components/logout-confirmation-sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUserProfile } from '@/lib/hooks/use-user-profile';

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useUserProfile();
  const { logout, isLoggingOut } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirmation(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-full'>
                  <AvatarImage src={user?.image} alt={user?.name || 'User'} />
                  <AvatarFallback className='rounded-full bg-gray-100'>
                    {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user?.name || 'Evento User'}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {user?.username ? `@${user.username}` : 'Welcome to Evento'}
                  </span>
                </div>
                <SidebarIcon icon={MoreVerticalIcon} size={16} className='ml-auto' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <DropdownMenuItem asChild>
                  <Link href='/e/profile' className='flex items-center gap-2 px-1 py-1.5'>
                    <Avatar className='h-8 w-8 rounded-full'>
                      <AvatarImage src={user?.image} alt={user?.name || 'User'} />
                      <AvatarFallback className='rounded-full bg-gray-100'>
                        {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-medium'>{user?.name || 'Evento User'}</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {user?.username ? `@${user.username}` : 'Welcome to Evento'}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/e/settings'>
                    <SidebarIcon icon={Settings02Icon} size={16} className='mr-2' />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='https://docs.evento.so' target='_blank' rel='noopener noreferrer'>
                    <SidebarIcon icon={CodeIcon} size={16} className='mr-2' />
                    API & Docs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='https://docs.evento.so' target='_blank' rel='noopener noreferrer'>
                    <SidebarIcon icon={BotIcon} size={16} className='mr-2' />
                    AI Agents
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/e/blog'>
                    <SidebarIcon icon={BookOpen01Icon} size={16} className='mr-2' />
                    Blog
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutClick} className='text-destructive'>
                <SidebarIcon icon={Logout02Icon} size={16} className='mr-2' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <LogoutConfirmationSheet
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
}
