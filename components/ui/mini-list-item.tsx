'use client';

import type React from 'react';

interface MiniListItemProps {
  icon?: React.ReactNode;
  text: string;
  onClick: () => void;
  className?: string;
}

export const MiniListItem = ({ icon, text, onClick, className = '' }: MiniListItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 ${className}`}
    >
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      <span className='text-gray-900 dark:text-neutral-100'>{text}</span>
    </button>
  );
};
