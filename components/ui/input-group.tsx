'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const inputGroupVariants = cva(
  'flex flex-col rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring',
  {
    variants: {
      variant: {
        default: '',
        ghost: 'border-transparent shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof inputGroupVariants> {}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(inputGroupVariants({ variant }), className)} {...props} />;
  }
);
InputGroup.displayName = 'InputGroup';

const inputGroupAddonVariants = cva('flex items-center px-3 py-2', {
  variants: {
    align: {
      'block-start': 'order-first',
      'block-end': 'order-last',
    },
  },
  defaultVariants: {
    align: 'block-start',
  },
});

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof inputGroupAddonVariants> {}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(inputGroupAddonVariants({ align }), className)} {...props} />
    );
  }
);
InputGroupAddon.displayName = 'InputGroupAddon';

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = 'InputGroupTextarea';

const inputGroupButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputGroupButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof inputGroupButtonVariants> {}

const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(inputGroupButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
InputGroupButton.displayName = 'InputGroupButton';

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea };
