'use client';

import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface RowCardProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  isClickable?: boolean;
  onClick?: () => void;
}

export default function RowCard({
  icon,
  title,
  subtitle,
  isClickable = false,
  onClick,
}: RowCardProps) {
  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={`w-full max-w-md rounded-3xl border border-gray-200 bg-gray-50 shadow-sm transition-all duration-200 ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''} `}
      onClick={handleClick}
    >
      <div className='flex items-center gap-4 px-6 py-6'>
        {/* Icon */}
        {icon && (
          <div className='flex-shrink-0'>
            <div className='flex h-8 w-8 items-center justify-center text-gray-700'>{icon}</div>
          </div>
        )}

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <h3 className='mb-1 text-lg font-bold leading-4 text-gray-900'>{title}</h3>
          {subtitle && (
            <p className='pt-1.5 text-base leading-4 leading-relaxed text-gray-500'>{subtitle}</p>
          )}
        </div>

        {/* Chevron right - only show if clickable */}
        {isClickable && (
          <div className='flex-shrink-0'>
            <ChevronRight className='h-5 w-5 text-gray-400' />
          </div>
        )}
      </div>
    </Card>
  );
}
