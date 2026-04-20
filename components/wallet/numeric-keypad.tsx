'use client';

import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface NumericKeypadProps {
  value?: string;
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onLongPressDelete?: () => void;
  onComplete?: (value: string) => void;
  showDecimal?: boolean;
  disabled?: boolean;
  maxLength?: number;
  enableKeyboard?: boolean;
}

export function NumericKeypad({
  value = '',
  onNumberClick,
  onDelete,
  onLongPressDelete,
  onComplete,
  showDecimal = true,
  disabled = false,
  maxLength,
  enableKeyboard = true,
}: NumericKeypadProps) {
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

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

  const handleNumberInput = useCallback(
    (num: string) => {
      if (disabled) return;

      const currentValue = valueRef.current;

      if (num === '.' && (!showDecimal || currentValue.includes('.'))) {
        return;
      }

      if (maxLength != null && currentValue.length >= maxLength) {
        return;
      }

      const nextValue = currentValue + num;
      valueRef.current = nextValue;
      onNumberClick(num);

      if (onComplete && maxLength != null && nextValue.length === maxLength) {
        onComplete(nextValue);
      }
    },
    [disabled, maxLength, onComplete, onNumberClick, showDecimal]
  );

  const handleDeleteInput = useCallback(() => {
    if (disabled) return;

    valueRef.current = valueRef.current.slice(0, -1);
    onDelete();
  }, [disabled, onDelete]);

  useEffect(() => {
    if (!enableKeyboard || disabled) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;

      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleNumberInput(event.key);
        return;
      }

      if (event.key === '.' && showDecimal) {
        event.preventDefault();
        handleNumberInput(event.key);
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleDeleteInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, enableKeyboard, handleDeleteInput, handleNumberInput, showDecimal]);

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
            onClick={() => handleNumberInput(num)}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className='flex h-16 select-none items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-2xl font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {num}
          </motion.button>
        );
      })}
      <motion.button
        onClick={handleDeleteInput}
        onMouseDown={handleDeletePressStart}
        onMouseUp={handleDeletePressEnd}
        onMouseLeave={handleDeletePressEnd}
        onTouchStart={handleDeletePressStart}
        onTouchEnd={handleDeletePressEnd}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className='flex h-16 select-none items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-900 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
      >
        <Delete className='h-6 w-6' />
      </motion.button>
    </div>
  );
}
