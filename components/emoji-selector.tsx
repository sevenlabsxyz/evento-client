'use client';

import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from '@/components/ui/emoji-picker';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface EmojiSelectorProps {
  selectedEmoji?: string | null;
  onEmojiSelect: (emoji: string | null) => void;
  className?: string;
}

export function EmojiSelector({ selectedEmoji, onEmojiSelect, className }: EmojiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    onEmojiSelect(emoji.emoji);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveEmoji = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmojiSelect(null);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Emoji Button */}
      <button
        type='button'
        onClick={handleButtonClick}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-200 bg-white transition-colors hover:border-gray-300 hover:bg-gray-50',
          isOpen && 'border-blue-500 bg-blue-50'
        )}
      >
        {selectedEmoji ? (
          <div className='relative flex items-center justify-center text-xl'>
            {selectedEmoji}
            {/* Small X button to remove emoji */}
            <button
              onClick={handleRemoveEmoji}
              className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-500 text-xs text-white hover:bg-gray-600'
            >
              ×
            </button>
          </div>
        ) : (
          <Smile className='h-5 w-5 text-gray-400' />
        )}
      </button>

      {/* Emoji Picker Dropdown */}
      {isOpen && (
        <div ref={pickerRef} className='absolute left-0 top-full z-50 mt-2 shadow-lg'>
          <EmojiPicker onEmojiSelect={handleEmojiSelect}>
            <EmojiPickerSearch />
            <EmojiPickerContent />
          </EmojiPicker>
        </div>
      )}
    </div>
  );
}
