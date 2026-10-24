'use client';

import { ArrowUpRight, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  external?: boolean;
}

export function NavMain({ items, label }: { items: NavMainItem[]; label?: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.external
              ? false
              : pathname === item.url ||
                (item.url !== '/' && pathname?.startsWith(item.url)) ||
                (item.url === '/e/hub' && pathname === '/');

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} isActive={isActive} asChild>
                  {item.external ? (
                    <a
                      href={item.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.icon && <item.icon />}
                      <span className='min-w-0 flex-1 truncate'>{item.title}</span>
                      <span className='sr-only'>(opens in a new tab)</span>
                      <ArrowUpRight
                        aria-hidden='true'
                        className='ml-auto !size-3.5 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden'
                      />
                    </a>
                  ) : (
                    <Link href={item.url} onClick={() => setOpenMobile(false)}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
