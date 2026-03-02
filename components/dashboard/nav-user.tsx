'use client';

import { BookOpen, Bot, Code2, LogOut, MoreVertical, Settings } from 'lucide-react';

import Link from 'next/link';
import { useState } from 'react';

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
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user?.image} alt={user?.name || 'User'} />
                  <AvatarFallback className='rounded-lg bg-gray-100'>
                    {user?.name?.charAt(0)?.toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user?.name || 'Evento User'}</span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {user?.username ? `@${user.username}` : 'Welcome to Evento'}
                  </span>
                </div>
                <MoreVertical className='ml-auto size-4' />
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
                    <Avatar className='h-8 w-8 rounded-lg'>
                      <AvatarImage src={user?.image} alt={user?.name || 'User'} />
                      <AvatarFallback className='rounded-lg bg-gray-100'>
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
                    <Settings className='mr-2 h-4 w-4' />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='https://docs.evento.so' target='_blank' rel='noopener noreferrer'>
                    <Code2 className='mr-2 h-4 w-4' />
                    API & Docs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href='https://docs.evento.so' target='_blank' rel='noopener noreferrer'>
                    <Bot className='mr-2 h-4 w-4' />
                    AI Agents
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href='/e/blog'>
                    <BookOpen className='mr-2 h-4 w-4' />
                    Blog
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutClick} className='text-destructive'>
                <LogOut className='mr-2 h-4 w-4' />
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
