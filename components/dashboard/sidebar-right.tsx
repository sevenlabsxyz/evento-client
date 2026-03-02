'use client';

import { Calendar } from '@/components/ui/calendar';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useRightSidebar } from '@/lib/stores/right-sidebar-store';
import { cn } from '@/lib/utils';
import * as React from 'react';

export function SidebarRight() {
  const { isOpen } = useRightSidebar();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div
      className={cn(
        'hidden text-sidebar-foreground lg:block',
        'transition-[width] duration-200 ease-linear',
        isOpen ? 'w-[--sidebar-width]' : 'w-0'
      )}
    >
      <div
        className={cn(
          'sticky top-0 h-svh w-[--sidebar-width] overflow-hidden border-l bg-sidebar transition-[transform] duration-200 ease-linear',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className='flex h-full w-full flex-col'>
          <SidebarHeader className='h-16 justify-center border-b border-sidebar-border'>
            <span className='px-2 text-sm font-medium'>Calendar</span>
          </SidebarHeader>
          <SidebarContent>
            <Calendar mode='single' selected={date} onSelect={setDate} />
          </SidebarContent>
        </div>
      </div>
    </div>
  );
}
