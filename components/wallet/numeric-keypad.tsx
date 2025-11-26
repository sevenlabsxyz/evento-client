'use client';

import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  showDecimal?: boolean;
  disabled?: boolean;
}

export function NumericKeypad({
  onNumberClick,
  onDelete,
  showDecimal = true,
  disabled = false,
}: NumericKeypadProps) {
  // Number layout: 1-9, then decimal (optional), 0, delete
  const numbers = showDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  return (
    <div className='grid grid-cols-3 gap-3'>
      {numbers.map((num, index) => {
        // Empty slot (for layout when decimal is hidden)
        if (num === '') {
          return <div key={`empty-${index}`} />;
        }

        return (
          <motion.button
            key={num}
            onClick={() => onNumberClick(num)}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className='flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl font-semibold text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {num}
          </motion.button>
        );
      })}
      <motion.button
        onClick={onDelete}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className='flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <Delete className='h-6 w-6' />
      </motion.button>
    </div>
  );
}
