'use client';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/stores/sidebar-store';
import { Menu } from 'lucide-react';
import type React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  showMenu?: boolean;
}

export function PageHeader({ title, subtitle, rightContent, showMenu = false }: PageHeaderProps) {
  const { openSidebar } = useSidebar();

  return (
    <div className='px-4 pb-0 pt-6'>
      <div className='mb-2 flex items-start justify-between'>
        <div className='flex flex-1 items-start gap-2'>
          {showMenu && (
            <Button
              variant='ghost'
              size='icon'
              className='mt-0.5 h-10 w-10 rounded-full bg-gray-100'
              onClick={openSidebar}
            >
              <Menu className='h-5 w-5' />
            </Button>
          )}
          <div className='flex-1'>
            <h1 className='mb-1 text-3xl font-bold text-black'>{title}</h1>
            <p className='text-sm text-gray-500'>{subtitle}</p>
          </div>
        </div>
        {rightContent && <div className='ml-4 flex gap-2'>{rightContent}</div>}
      </div>
    </div>
  );
}
