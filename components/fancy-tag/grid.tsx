'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag } from './tag';

interface TagGridProps {
  items: string[];
  title?: string;
}

export function TagGrid({
  items,
  title = 'What are your favorite cuisines?',
}: TagGridProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleItem = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className='min-h-screen bg-white p-6 pt-40'>
      <h1 className='text-black text-3xl font-semibold mb-12 text-center'>
        {title}
      </h1>
      <div className='max-w-[570px] mx-auto'>
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
              isSelected={selected.includes(item)}
              onToggle={() => toggleItem(item)}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
