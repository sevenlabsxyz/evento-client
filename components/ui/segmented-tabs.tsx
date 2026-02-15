'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

export type SegmentedTabItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

interface SegmentedTabsProps {
  items: SegmentedTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  // Styling controls
  align?: 'left' | 'center';
  wrapperClassName?: string;
  gapClassName?: string;
  buttonBaseClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function SegmentedTabs({
  items,
  value,
  onValueChange,
  align = 'center',
  wrapperClassName,
  gapClassName,
  buttonBaseClassName = 'rounded-full px-4 py-2 text-sm font-semibold transition-colors border border-gray-200',
  activeClassName = 'bg-white text-black',
  inactiveClassName = 'bg-transparent text-gray-500 hover:bg-gray-50 border-transparent',
}: SegmentedTabsProps) {
  const defaultGapClassName = `flex flex-row items-center ${align === 'center' ? 'justify-center' : 'justify-start'} gap-2`;
  const Buttons = (
    <div className='mb-2 rounded-full bg-gray-50 p-2'>
      {items.map((item) => (
        <motion.button
          key={item.value}
          onClick={() => !item.disabled && onValueChange(item.value)}
          disabled={item.disabled}
          role='tab'
          aria-selected={value === item.value}
          aria-controls={`tabpanel-${item.value}`}
          className={cn(
            buttonBaseClassName,
            value === item.value ? activeClassName : inactiveClassName,
            item.disabled && 'pointer-events-none opacity-50'
          )}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {item.label}
        </motion.button>
      ))}
    </div>
  );

  // Always render a single wrapper div. Apply default padding if none provided,
  // and always apply the gapClassName so spacing can be customized independently.
  return (
    <div className={cn(wrapperClassName ?? 'mb-2 px-4 py-3', gapClassName ?? defaultGapClassName)}>
      {Buttons}
    </div>
  );
}

export default SegmentedTabs;
