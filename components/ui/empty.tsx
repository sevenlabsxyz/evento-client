import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty'
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-5 text-balance px-6 py-8 text-center md:px-8 md:py-10',
        className
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty-header'
      className={cn('flex max-w-md flex-col items-center gap-2.5 text-center', className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  'mb-1.5 flex shrink-0 items-center justify-center text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted/70 text-muted-foreground flex shrink-0 items-center justify-center rounded-2xl [&_svg:not([class*='size-'])]:size-6",
        'soft-square':
          "bg-muted/70 text-muted-foreground flex shrink-0 items-center justify-center rounded-2xl [&_svg:not([class*='size-'])]:size-7",
        'soft-circle':
          "bg-muted/70 text-muted-foreground flex shrink-0 items-center justify-center rounded-full [&_svg:not([class*='size-'])]:size-7",
        'soft-squircle':
          "bg-muted/70 text-muted-foreground flex shrink-0 items-center justify-center rounded-[1.75rem] [&_svg:not([class*='size-'])]:size-7",
      },
      size: {
        sm: 'size-12',
        md: 'size-16',
        lg: 'size-20',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

function EmptyMedia({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot='empty-media'
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot='empty-title'
      className={cn('text-base font-semibold tracking-tight text-foreground sm:text-lg', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot='empty-description'
      className={cn(
        'max-w-md text-sm/relaxed text-muted-foreground sm:text-base/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        className
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty-content'
      className={cn(
        'flex w-full min-w-0 max-w-md flex-col items-center gap-3 text-balance text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
