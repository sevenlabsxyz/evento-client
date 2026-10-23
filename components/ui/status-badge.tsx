import { cva, type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      status: {
        success:
          'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400',
        error:
          'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400',
        default:
          'border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300',
      },
    },
    defaultVariants: {
      status: 'default',
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  leftLabel: string;
  rightLabel?: string;
}

export function StatusBadge({
  className,
  status,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftLabel,
  rightLabel,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className='inline-flex items-center gap-1.5 font-semibold'>
        {LeftIcon && (
          <LeftIcon
            className={cn(
              'size-3 shrink-0',
              status === 'success' && 'text-green-600 dark:text-green-400',
              status === 'error' && 'text-red-600 dark:text-red-400'
            )}
            aria-hidden={true}
          />
        )}
        {leftLabel}
      </span>
      {rightLabel && (
        <>
          <span className='mx-2 h-3.5 w-px bg-border' />
          <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
            {RightIcon && <RightIcon className='size-3 shrink-0' aria-hidden={true} />}
            {rightLabel}
          </span>
        </>
      )}
    </span>
  );
}

export { statusBadgeVariants };
