'use client';

import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { useRef } from 'react';

interface NumericKeypadProps {
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onLongPressDelete?: () => void;
  showDecimal?: boolean;
  disabled?: boolean;
}

export function NumericKeypad({
  onNumberClick,
  onDelete,
  onLongPressDelete,
  showDecimal = true,
  disabled = false,
}: NumericKeypadProps) {
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeletePressStart = () => {
    if (!onLongPressDelete) return;
    pressTimerRef.current = setTimeout(() => {
      onLongPressDelete();
    }, 3000); // 3 seconds
  };

  const handleDeletePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  // Number layout: 1-9, then decimal (optional), 0, delete
  const numbers = showDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'];

  return (
    <div className='grid grid-cols-3 gap-3 px-4'>
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
            className='flex h-16 select-none items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-2xl font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {num}
          </motion.button>
        );
      })}
      <motion.button
        onClick={onDelete}
        onMouseDown={handleDeletePressStart}
        onMouseUp={handleDeletePressEnd}
        onMouseLeave={handleDeletePressEnd}
        onTouchStart={handleDeletePressStart}
        onTouchEnd={handleDeletePressEnd}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className='flex h-16 select-none items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-900 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <Delete className='h-6 w-6' />
      </motion.button>
    </div>
  );
}
