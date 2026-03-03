'use client';

import { Calendar } from '@/components/ui/calendar';
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useRightSidebar } from '@/lib/stores/right-sidebar-store';
import * as React from 'react';

export function SidebarRight() {
  const { isOpen } = useRightSidebar();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const state = isOpen ? 'expanded' : 'collapsed';

  return (
    <div
      className='group hidden text-sidebar-foreground lg:block'
      data-state={state}
      data-collapsible={state === 'collapsed' ? 'offcanvas' : ''}
      data-side='right'
    >
      {/* Gap div — in flow, transitions width to push/release content */}
      <div className='relative w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0' />

      {/* Panel — fixed, transitions right position to slide in/out */}
      <div className='fixed inset-y-0 right-0 z-10 hidden h-svh w-[--sidebar-width] bg-sidebar transition-[right] duration-200 ease-linear group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] lg:flex'>
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
