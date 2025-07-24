'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface TagProps {
  text: string;
  isSelected: boolean;
  onToggle: () => void;
}

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
      className={`
        inline-flex items-center px-4 py-2 rounded-full text-base font-medium
        whitespace-nowrap overflow-hidden ring-1 ring-inset
        ${isSelected ? 'text-red-600 ring-[rgba(0,0,0,0.12)]' : 'text-gray-600 ring-[rgba(0,0,0,0.06)]'}
      `}
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
              <div className='w-4 h-4 rounded-full bg-red-600 flex items-center justify-center'>
                <Check className='w-3 h-3 text-white' strokeWidth={1.5} />
              </div>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
