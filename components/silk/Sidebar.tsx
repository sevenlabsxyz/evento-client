'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useSidebar } from '@/lib/stores/sidebar-store';
import { Scroll, Sheet, VisuallyHidden } from '@silk-hq/components';
import {
  BookOpen,
  Calendar1,
  Home,
  Inbox,
  LogOut,
  MessageCircle,
  MessageCircleQuestion,
  Plus,
  Settings,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const router = useRouter();
  const { logout } = useAuth();
  const { user } = useUserProfile();

  const handleNavigation = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, '_blank');
    } else {
      router.push(path);
    }
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  // Menu sections
  const menuSections = [
    {
      title: 'Menu',
      items: [
        {
          name: 'Home',
          path: '/',
          icon: <Home className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Chat',
          path: '/e/messages',
          icon: <MessageCircle className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Inbox',
          path: '/e/notifications',
          icon: <Inbox className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Settings',
          path: '/e/settings',
          icon: <Settings className='h-5 w-5' strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: 'My Events',
      items: [
        {
          name: 'View All Events',
          path: '/e/hub#',
          icon: <Calendar1 className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Saved Events',
          path: '/e/saved',
          icon: <Star className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Create Event',
          path: '/e/create',
          icon: <Plus className='h-5 w-5' strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          name: 'Read Blog',
          path: '/blog',
          icon: <BookOpen className='h-5 w-5' strokeWidth={2.5} />,
        },
        {
          name: 'Contact Support',
          path: '/e/contact',
          icon: <MessageCircleQuestion className='h-5 w-5' strokeWidth={2.5} />,
        },
      ],
    },
  ];

  return (
    <Sheet.Root
      license='commercial'
      presented={isOpen}
      onPresentedChange={(presented) => {
        if (!presented) closeSidebar();
      }}
    >
      <Sheet.Portal>
        <Sheet.View
          contentPlacement='left'
          swipeOvershoot={false}
          nativeEdgeSwipePrevention={true}
          style={{
            zIndex: 50,
            height: 'calc(var(--silk-100-lvh-dvh-pct) + 60px)',
          }}
        >
          <Sheet.Backdrop className='bg-black/30' onClick={closeSidebar} />
          <Sheet.Content
            style={{
              width: 'min(90vw, 325px)',
              boxShadow:
                '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              backgroundColor: 'hsl(var(--sidebar-background))',
            }}
          >
            {/* Accessibility */}
            <VisuallyHidden.Root>
              <Sheet.Title>Navigation Menu</Sheet.Title>
              <Sheet.Description>Main navigation sidebar</Sheet.Description>
              <Sheet.Trigger action='dismiss'>
                Close navigation menu
              </Sheet.Trigger>
            </VisuallyHidden.Root>

            <div className='flex h-full flex-col'>
              {/* Header with user info */}
              <div
                className='border-b border-sidebar-border bg-sidebar-accent'
                style={{
                  padding: '1.5rem',
                  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
                }}
              >
                <div className='grid grid-cols-[50px_1fr] gap-x-3 gap-y-0.5'>
                  {/* User avatar */}
                  <button
                    onClick={() => handleNavigation('/e/profile')}
                    className='row-span-2 h-[50px] w-[50px] cursor-pointer rounded-full border-0 bg-transparent p-0 transition-opacity hover:opacity-80'
                    aria-label='Go to profile'
                  >
                    <Avatar className='h-[50px] w-[50px] border border-black/10'>
                      <AvatarImage
                        src={user?.image || ''}
                        alt={user?.name || user?.username || 'User'}
                      />
                      <AvatarFallback className='bg-white bg-gradient-to-br'>
                        <Image
                          src='/assets/img/evento-sublogo.svg'
                          width={32}
                          height={32}
                          alt='Evento'
                          className='h-full w-full p-1'
                        />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <button
                    onClick={() => handleNavigation('/e/profile')}
                    className='cursor-pointer border-0 bg-transparent p-0 text-left text-xl font-bold text-sidebar-foreground transition-colors hover:text-sidebar-foreground/80'
                    aria-label='Go to profile'
                  >
                    {user?.name || 'Evento'}
                  </button>
                  <button
                    onClick={() => handleNavigation('/e/profile')}
                    className='cursor-pointer border-0 bg-transparent p-0 text-left text-sm text-muted-foreground transition-colors hover:text-muted-foreground/80'
                    aria-label='Go to profile'
                  >
                    {user?.username ? `@${user.username}` : 'Welcome to Evento'}
                  </button>
                </div>
              </div>

              {/* Scrollable menu sections */}
              <Scroll.Root className='min-h-0 flex-1'>
                <Scroll.View
                  className='h-full'
                  scrollGestureTrap={{ yEnd: true }}
                  safeArea='layout-viewport'
                >
                  <Scroll.Content className='p-6'>
                    <div className='grid gap-10'>
                      {menuSections.map((section) => (
                        <div key={section.title} className='grid gap-5'>
                          <h3 className='m-0 text-sm font-semibold uppercase text-gray-400'>
                            {section.title}
                          </h3>
                          <ul className='m-0 grid list-none gap-2.5 p-0'>
                            {section.items.map((item) => (
                              <li key={item.path}>
                                <button
                                  onClick={() =>
                                    handleNavigation(
                                      item.path,
                                      (item as any).isExternal
                                    )
                                  }
                                  className='-mx-3 grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-lg px-3 py-2 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent'
                                >
                                  <span className='text-[0]'>{item.icon}</span>
                                  <span className='text-lg font-medium'>
                                    {item.name}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Logout button */}
                      <div className='border-t border-sidebar-border pt-6'>
                        <button
                          onClick={handleLogout}
                          className='-mx-3 grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-lg px-3 py-2 text-left text-destructive transition-colors hover:bg-red-500/10'
                        >
                          <span className='text-[0]'>
                            <LogOut className='h-5 w-5' strokeWidth={2.5} />
                          </span>
                          <span className='text-lg font-medium'>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </Scroll.Content>
                </Scroll.View>
              </Scroll.Root>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
