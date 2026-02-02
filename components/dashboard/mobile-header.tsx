'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface MobileHeaderProps {
  title?: string;
  rightContent?: React.ReactNode;
}

export function MobileHeader({ title, rightContent }: MobileHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleMenuClick = () => {
    setIsSpinning(true);
    toggleSidebar();
    setTimeout(() => setIsSpinning(false), 400);
  };

  return (
    <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden'>
      <div className='flex w-full items-center gap-3 px-4'>
        <motion.button
          onClick={handleMenuClick}
          className={`rounded-full border border-gray-200 bg-gray-50 p-0 transition-all duration-300 hover:bg-gray-100 hover:opacity-80 ${isSpinning ? 'animate-spin' : ''}`}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Image priority src='/assets/img/evento-sublogo.svg' alt='Menu' width={32} height={32} />
        </motion.button>
        {title && <h1 className='flex-1 truncate text-lg font-semibold text-gray-500'>{title}</h1>}
        {rightContent && <div className='ml-auto flex items-center gap-2'>{rightContent}</div>}
      </div>
    </header>
  );
}
