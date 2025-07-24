'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Tag } from './tag';

interface TagSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onToggleItem: (item: string) => void;
  isClickable?: boolean;
  onClick?: () => void;
}

export function TagSection({
  title,
  items,
  selectedItems,
  onToggleItem,
  isClickable = false,
  onClick,
}: TagSectionProps) {
  return (
    <Card
      className={`w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''} `}
      onClick={onClick}
    >
      <div className='p-6'>
        <h2 className='mb-4 text-left text-lg font-semibold text-black'>{title}</h2>
        <motion.div
          className='flex flex-wrap gap-3 overflow-visible'
          layout
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.5,
          }}
        >
          {items.map((item) => (
            <Tag
              key={item}
              text={item}
              isSelected={selectedItems.includes(item)}
              onToggle={() => onToggleItem(item)}
            />
          ))}
        </motion.div>
      </div>
    </Card>
  );
}
