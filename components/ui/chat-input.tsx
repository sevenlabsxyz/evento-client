'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2Icon, SendIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, KeyboardEventHandler } from 'react';
import { Children } from 'react';

export type ChatInputProps = HTMLAttributes<HTMLFormElement>;

export const ChatInput = ({ className, ...props }: ChatInputProps) => (
  <form
    className={cn(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm',
      className
    )}
    {...props}
  />
);

export type ChatInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export const ChatInputTextarea = ({
  onChange,
  className,
  placeholder = 'Type a message...',
  minHeight = 48,
  maxHeight = 164,
  ...props
}: ChatInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter') {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return;
      }

      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <Textarea
      className={cn(
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent',
        'focus-visible:ring-0',
        className
      )}
      name='message'
      onChange={(e) => {
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type ChatInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const ChatInputToolbar = ({ className, ...props }: ChatInputToolbarProps) => (
  <div className={cn('flex items-center justify-between p-1', className)} {...props} />
);

export type ChatInputButtonProps = ComponentProps<typeof Button>;

export const ChatInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: ChatInputButtonProps) => {
  const newSize = (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';

  return (
    <Button
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className
      )}
      size={newSize}
      type='button'
      variant={variant}
      {...props}
    />
  );
};

export type ChatInputSubmitProps = ComponentProps<typeof Button> & {
  status?: 'loading' | 'error';
};

export const ChatInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: ChatInputSubmitProps) => {
  let Icon = <SendIcon className='size-4' />;

  if (status === 'loading') {
    Icon = <Loader2Icon className='size-4 animate-spin' />;
  }

  return (
    <Button
      className={cn('gap-1.5 rounded-lg', className)}
      size={size}
      type='submit'
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};
