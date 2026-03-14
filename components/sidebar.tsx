'use client';

import { LogoutConfirmationSheet } from '@/components/logout-confirmation-sheet';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/lib/hooks/use-auth';

import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useSidebar } from '@/lib/stores/sidebar-store';
import { Scroll, Sheet, VisuallyHidden } from '@silk-hq/components';
import {
  BookOpen,
  Calendar1,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Star,
  UserCircle,
  Zap,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Menu sections configuration
const menuSections = [
  {
    title: 'Menu',
    items: [
      {
        name: 'Events',
        path: '/',
        icon: <Calendar1 className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Lists',
        path: '/e/lists',
        icon: <Star className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Search',
        path: '/e/search',
        icon: <Search className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Wallet',
        path: '/e/wallet',
        icon: <Zap className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Chat',
        path: '/e/messages',
        icon: <MessageCircle className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Profile',
        path: '/e/profile',
        icon: <UserCircle className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Settings',
        path: '/e/settings',
        icon: <Settings className='h-5 w-5' strokeWidth={2.5} />,
      },
      {
        name: 'Blog',
        path: '/e/blog',
        icon: <BookOpen className='h-5 w-5' strokeWidth={2.5} />,
      },
    ],
  },
];

// Extracted sidebar content component for reuse
function SidebarContent({
  user,
  handleNavigation,
  handleLogout,
  pathname,
  isDesktop = false,
}: {
  user: any;
  handleNavigation: (path: string, isExternal?: boolean) => void;
  handleLogout: () => void;
  pathname: string;
  isDesktop?: boolean;
}) {
  return (
    <div className='flex h-full flex-col'>
      {/* Header with user info */}
      <div
        className=''
        style={{
          padding: '1.5rem',
          paddingTop: isDesktop ? '1.5rem' : 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        }}
      >
        <div className='grid grid-cols-[50px_1fr] gap-x-3 gap-y-0.5'>
          {/* User avatar */}
          <UserAvatar
            user={user}
            onAvatarClick={() => handleNavigation('/e/profile')}
            height={50}
            width={50}
            className='row-span-2'
          />
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

      {/* Create Event button */}
      <div className='px-6 pb-4'>
        <Button onClick={() => handleNavigation('/e/create')} className='h-12 w-full rounded-full'>
          <Plus className='h-5 w-5' />
          Create Event
        </Button>
      </div>

      {/* Scrollable menu sections */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='p-6'>
          <div className='grid gap-10'>
            {menuSections.map((section) => (
              <div key={section.title} className='grid gap-5'>
                <h3 className='m-0 text-sm font-semibold uppercase text-gray-400'>
                  {section.title}
                </h3>
                <ul className='m-0 grid list-none gap-2.5 p-0'>
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.path ||
                      (item.path !== '/' && pathname?.startsWith(item.path)) ||
                      (item.path === '/' && pathname === '/e/hub');
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigation(item.path, (item as any).isExternal)}
                          className={`-mx-3 grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          }`}
                        >
                          <span className='text-[0]'>{item.icon}</span>
                          <span className='text-lg font-medium'>{item.name}</span>
                        </button>
                      </li>
                    );
                  })}
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
        </div>
      </div>
    </div>
  );
}

// Mobile sidebar content with Silk Scroll component
function MobileSidebarContent({
  user,
  handleNavigation,
  handleLogout,
  pathname,
}: {
  user: any;
  handleNavigation: (path: string, isExternal?: boolean) => void;
  handleLogout: () => void;
  pathname: string;
}) {
  return (
    <div className='flex h-full flex-col'>
      {/* Header with user info */}
      <div
        className=''
        style={{
          padding: '1.5rem',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        }}
      >
        <div className='grid grid-cols-[50px_1fr] gap-x-3 gap-y-0.5'>
          {/* User avatar */}
          <UserAvatar
            user={user}
            onAvatarClick={() => handleNavigation('/e/profile')}
            height={50}
            width={50}
            className='row-span-2'
          />
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

      {/* Create Event button */}
      <div className='px-6 pb-4'>
        <Button onClick={() => handleNavigation('/e/create')} className='h-12 w-full rounded-full'>
          <Plus className='h-5 w-5' />
          Create Event
        </Button>
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
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.path ||
                        (item.path !== '/' && pathname?.startsWith(item.path));
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => handleNavigation(item.path, (item as any).isExternal)}
                            className={`-mx-3 grid w-full grid-cols-[auto_1fr] items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                              isActive
                                ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                            }`}
                          >
                            <span className='text-[0]'>{item.icon}</span>
                            <span className='text-lg font-medium'>{item.name}</span>
                          </button>
                        </li>
                      );
                    })}
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
  );
}

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();
  const { user } = useUserProfile();

  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  // Prefetch priority routes on mount
  useEffect(() => {
    const priorityRoutes = ['/e/hub', '/e/search', '/e/profile', '/e/wallet'];
    priorityRoutes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  if (pathname?.startsWith('/auth') || pathname === '/' || pathname === '/onboarding') {
    return null;
  }

  const handleNavigation = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, '_blank');
    } else {
      router.push(path);
    }
    closeSidebar();
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    closeSidebar();
    setShowLogoutConfirmation(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <>
      {/* Desktop: Always-visible fixed sidebar */}
      <aside className='bg-sidebar-background fixed left-0 top-0 z-40 hidden h-full w-[280px] border-r border-sidebar-border md:flex md:flex-col'>
        <SidebarContent
          user={user}
          handleNavigation={handleNavigation}
          handleLogout={handleLogoutClick}
          pathname={pathname || ''}
          isDesktop={true}
        />
      </aside>

      {/* Mobile: Sheet/drawer (hidden on desktop) */}
      <div className='md:hidden'>
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
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  backgroundColor: 'hsl(var(--sidebar-background))',
                }}
              >
                {/* Accessibility */}
                <VisuallyHidden.Root>
                  <Sheet.Title>Navigation Menu</Sheet.Title>
                  <Sheet.Description>Main navigation sidebar</Sheet.Description>
                  <Sheet.Trigger action='dismiss'>Close navigation menu</Sheet.Trigger>
                </VisuallyHidden.Root>

                <MobileSidebarContent
                  user={user}
                  handleNavigation={handleNavigation}
                  handleLogout={handleLogoutClick}
                  pathname={pathname || ''}
                />
              </Sheet.Content>
            </Sheet.View>
          </Sheet.Portal>
        </Sheet.Root>
      </div>

      {/* Logout Confirmation Sheet */}
      <LogoutConfirmationSheet
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
}
