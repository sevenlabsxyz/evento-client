'use client';

import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      className={`
        w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm 
        transition-all duration-200 
        ${isClickable ? 'hover:shadow-md cursor-pointer active:scale-[0.98]' : ''} 
      `}
      onClick={handleClick}
    >
      <div className='flex items-center p-4 gap-4 py-6'>
        {/* Icon */}
        {icon && (
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 flex items-center justify-center text-gray-700'>
              {icon}
            </div>
          </div>
        )}

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <h3 className='text-lg font-semibold text-gray-900 mb-1 leading-4'>
            {title}
          </h3>
          {subtitle && (
            <p className='text-gray-500 leading-relaxed text-base leading-4 pt-1.5'>
              {subtitle}
            </p>
          )}
        </div>

        {/* Chevron right - only show if clickable */}
        {isClickable && (
          <div className='flex-shrink-0'>
            <ChevronRight className='w-5 h-5 text-gray-400' />
          </div>
        )}
      </div>
    </Card>
  );
}
