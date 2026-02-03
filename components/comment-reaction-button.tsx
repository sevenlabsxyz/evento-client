'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CommentReactionButtonProps {
  icon: LucideIcon;
  count?: number;
  label?: string;
  isActive?: boolean;
  activeClassName?: string;
  fillWhenActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
}

export function CommentReactionButton({
  icon: Icon,
  count,
  label,
  isActive,
  activeClassName = 'bg-red-50 text-red-500',
  fillWhenActive = false,
  onClick,
  disabled,
  className,
}: CommentReactionButtonProps) {
  const showCount = count !== undefined && count > 0;
  const isPill = showCount || label;

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-full transition-colors',
        'bg-gray-50 text-gray-600 hover:bg-gray-100',
        isPill ? 'h-8 px-3' : 'h-8 w-8',
        isActive && activeClassName,
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <Icon className='h-4 w-4' fill={fillWhenActive && isActive ? 'currentColor' : 'none'} />
      {showCount && <span className='text-xs font-medium'>{count}</span>}
      {label && <span className='text-xs font-medium'>{label}</span>}
    </button>
  );
}
