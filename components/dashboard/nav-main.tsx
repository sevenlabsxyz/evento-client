'use client';

import { AppIconComponent } from '@/lib/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: AppIconComponent;
    external?: boolean;
  }[];
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
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
                      rel='noreferrer'
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
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
