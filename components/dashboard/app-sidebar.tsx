'use client';

import {
  BookOpen,
  Bot,
  Calendar1,
  Code2,
  KeyRound,
  LucideIcon,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  Shield,
  Shirt,
  Star,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { NavMain, NavMainItem } from '@/components/dashboard/nav-main';
import { NavTheme } from '@/components/dashboard/nav-theme';
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
import { useDeveloperSettingsStore } from '@/lib/stores/developer-settings-store';
// import { useRightSidebar } from '@/lib/stores/right-sidebar-store';

type SidebarItemKey = 'events' | 'search' | 'lists' | 'wallet' | 'api' | 'mcp' | 'apiKeys';

interface SidebarLink {
  key: SidebarItemKey;
  url: string;
  icon: LucideIcon;
}

const navMain: SidebarLink[] = [
  { key: 'events', url: '/e/hub', icon: Calendar1 },
  { key: 'search', url: '/e/search', icon: Search },
  { key: 'lists', url: '/e/lists', icon: Star },
  { key: 'wallet', url: '/e/wallet', icon: Zap },
];

const developerLinks: SidebarLink[] = [
  { key: 'api', url: '/e/api', icon: Code2 },
  { key: 'mcp', url: '/e/mcp', icon: Bot },
];

const apiKeysLink: SidebarLink = { key: 'apiKeys', url: '/e/settings/api-keys', icon: KeyRound };

const SETTINGS_URL = '/e/settings';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const isDeveloperMode = useDeveloperSettingsStore((s) => s.isDeveloperMode);
  const [mounted, setMounted] = React.useState(false);
  // const { isOpen: isCalendarOpen, toggle: toggleCalendar } = useRightSidebar();

  // Developer mode is persisted in localStorage; wait for mount so the
  // server markup matches the first client render.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toNavItem = ({ key, url, icon }: SidebarLink): NavMainItem => ({
    title: t(`sidebar.items.${key}`),
    url,
    icon,
  });
  const mainItems = navMain.map(toNavItem);
  const developerLinksShown =
    mounted && isDeveloperMode ? [...developerLinks, apiKeysLink] : developerLinks;
  const developerItems = developerLinksShown.map(toNavItem);

  // Settings sub-pages that have their own sidebar entry (API keys) highlight that entry instead.
  const isSettingsActive =
    pathname === SETTINGS_URL ||
    (!!pathname?.startsWith(`${SETTINGS_URL}/`) &&
      !developerLinksShown.some((link) => pathname?.startsWith(link.url)));
  const settingsLabel = t('sidebar.items.settings');
  const createEventLabel = t('sidebar.createEvent');
  const sidebarToggleLabel =
    state === 'expanded' ? t('sidebar.hideSidebar') : t('sidebar.showSidebar');

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
            {createEventLabel}
          </Button>
        </div>
        {/* Collapsed: icon-only dark SidebarMenuButton — fades in as sidebar collapses */}
        <SidebarMenu className='pointer-events-none h-0 overflow-hidden opacity-0 transition-opacity duration-200 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:opacity-100'>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={createEventLabel}
              onClick={handleCreateEvent}
              className='rounded-full bg-black text-white hover:bg-black/90 hover:text-white active:bg-black/80 group-data-[collapsible=icon]:!rounded-full dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:hover:text-neutral-900 dark:active:bg-neutral-300 dark:active:text-neutral-900'
            >
              <Plus />
              <span>{createEventLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} />
        <NavMain label={t('sidebar.developers')} items={developerItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('sidebar.items.blog')} asChild>
              <Link href='/e/blog' onClick={() => setOpenMobile(false)}>
                <BookOpen />
                <span>{t('sidebar.items.blog')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('sidebar.items.security')} asChild>
              <Link href='/e/security' onClick={() => setOpenMobile(false)}>
                <Shield />
                <span>{t('sidebar.items.security')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('sidebar.items.store')} asChild>
              <a
                href='https://theoriginal.com/bitcoin'
                target='_blank'
                rel='noreferrer'
                onClick={() => setOpenMobile(false)}
              >
                <Shirt />
                <span>{t('sidebar.items.store')}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={settingsLabel} isActive={isSettingsActive} asChild>
              <Link href={SETTINGS_URL} onClick={() => setOpenMobile(false)}>
                <Settings />
                <span>{settingsLabel}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavTheme />
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isCalendarOpen ? 'Hide Calendar' : 'Show Calendar'}
              onClick={toggleCalendar}
            >
              {isCalendarOpen ? <PanelRightClose /> : <PanelRightOpen />}
              <span>{isCalendarOpen ? 'Hide Calendar' : 'Show Calendar'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          <SidebarMenuItem className='hidden md:block'>
            <SidebarMenuButton tooltip={sidebarToggleLabel} onClick={toggleSidebar}>
              {state === 'expanded' ? <PanelRightOpen /> : <PanelRightClose />}
              <span>{sidebarToggleLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
