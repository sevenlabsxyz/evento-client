'use client';

import { Calendar } from '@/components/ui/calendar';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useRightSidebar } from '@/lib/stores/right-sidebar-store';
import { cn } from '@/lib/utils';
import * as React from 'react';

export function SidebarRight({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isOpen } = useRightSidebar();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Sidebar
      collapsible='none'
      className={cn('sticky top-0 hidden h-svh border-l lg:flex', !isOpen && '!hidden')}
      {...props}
    >
      <SidebarHeader className='h-16 justify-center border-b border-sidebar-border'>
        <span className='px-2 text-sm font-medium'>Calendar</span>
      </SidebarHeader>
      <SidebarContent>
        <Calendar mode='single' selected={date} onSelect={setDate} />
      </SidebarContent>
    </Sidebar>
  );
}
