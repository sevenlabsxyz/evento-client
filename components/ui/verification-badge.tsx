'use client';

import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeCheckProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerificationBadgeCheck = ({ 
  size = 'md', 
  className 
}: VerificationBadgeCheckProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  return (
    <BadgeCheck 
      className={cn(
        'rounded-full bg-red-600 text-white shadow-sm ml-1',
        sizeClasses[size],
        className
      )} 
    />
  );
};