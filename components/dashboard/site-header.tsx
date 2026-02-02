'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface SiteHeaderProps {
  title?: string;
  rightContent?: React.ReactNode;
}

export function SiteHeader({ title, rightContent }: SiteHeaderProps) {
  return (
    <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
        {title && <h1 className='text-base font-medium'>{title}</h1>}
        {rightContent && <div className='ml-auto flex items-center gap-2'>{rightContent}</div>}
      </div>
    </header>
  );
}
