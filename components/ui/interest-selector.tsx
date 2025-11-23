'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface InterestCategory {
  title: string;
  items: string[];
}

interface InterestsSelectorProps {
  categories: InterestCategory[];
  initialSelectedInterests?: string[];
  onChange?: (selectedInterests: string[]) => void;
  mainTitle?: string;
  hideTitle?: boolean;
  className?: string;
  contentClassName?: string;
}

interface TagSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onToggleItem: (item: string) => void;
}

interface TagProps {
  text: string;
  isSelected: boolean;
  onToggle: () => void;
}

// ============================================================================
// Tag Component
// ============================================================================

export function Tag({ text, isSelected, onToggle }: TagProps) {
  return (
    <motion.button
      onClick={onToggle}
      layout
      initial={false}
      animate={{
        backgroundColor: isSelected ? '#fef2f2' : 'rgba(229, 231, 235, 0.5)',
      }}
      whileHover={{
        backgroundColor: isSelected ? '#fef2f2' : 'rgba(229, 231, 235, 0.8)',
      }}
      whileTap={{
        backgroundColor: isSelected ? '#fee2e2' : 'rgba(229, 231, 235, 0.9)',
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
        backgroundColor: { duration: 0.1 },
      }}
      className={`inline-flex items-center overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-base font-medium ring-1 ring-inset ${isSelected ? 'text-red-600 ring-[rgba(0,0,0,0.12)]' : 'text-gray-600 ring-[rgba(0,0,0,0.06)]'} `}
    >
      <motion.div
        className='relative flex items-center'
        animate={{
          width: isSelected ? 'auto' : '100%',
          paddingRight: isSelected ? '1.5rem' : '0',
        }}
        transition={{
          ease: [0.175, 0.885, 0.32, 1.275],
          duration: 0.3,
        }}
      >
        <span>{text}</span>
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
              className='absolute right-0'
            >
              <div className='flex h-4 w-4 items-center justify-center rounded-full bg-red-600'>
                <Check className='h-3 w-3 text-white' strokeWidth={1.5} />
              </div>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

// ============================================================================
// TagSection Component
// ============================================================================

export function TagSection({ title, items, selectedItems, onToggleItem }: TagSectionProps) {
  return (
    <div className='mb-16'>
      <h2 className='mb-8 text-left text-2xl font-semibold text-black'>{title}</h2>
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
  );
}

// ============================================================================
// InterestsSelector Component
// ============================================================================

export function InterestsSelector({
  categories,
  initialSelectedInterests = [],
  onChange,
  mainTitle = 'Select your interests.',
  hideTitle = false,
  className = 'min-h-screen bg-white p-6 pt-20',
  contentClassName = 'mx-auto max-w-[570px]',
}: InterestsSelectorProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelectedInterests);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
      // Notify parent of selection change
      onChange?.(newSelection);
      return newSelection;
    });
  };

  return (
    <div className={className}>
      {!hideTitle && (
        <h1 className='mb-16 text-center text-3xl font-semibold text-black'>{mainTitle}</h1>
      )}
      <div className={contentClassName}>
        {categories.map((category) => (
          <TagSection
            key={category.title}
            title={category.title}
            items={category.items}
            selectedItems={selectedItems}
            onToggleItem={toggleItem}
          />
        ))}
      </div>
    </div>
  );
}
