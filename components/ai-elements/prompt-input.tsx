'use client';

import { cn } from '@/lib/utils';
import { CornerDownLeft } from 'lucide-react';
import * as React from 'react';

export interface PromptInputMessage {
  text: string;
}

export interface PromptInputProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit: (message: PromptInputMessage) => void;
}

export const PromptInput = ({ className, onSubmit, children, ...props }: PromptInputProps) => {
  return (
    <form
      className={cn('w-full', className)}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const text = (formData.get('message') as string) || '';
        if (text.trim()) {
          onSubmit({ text: text.trim() });
          e.currentTarget.reset();
        }
      }}
      {...props}
    >
      <div className='flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md'>
        {children}
      </div>
    </form>
  );
};

export interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  PromptInputTextareaProps
>(({ className, onKeyDown, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);

    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <textarea
      ref={ref}
      name='message'
      className={cn(
        'flex w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-gray-400',
        'max-h-[200px] min-h-[48px]',
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = 'PromptInputTextarea';

export interface PromptInputFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2',
      className
    )}
    {...props}
  />
);

export interface PromptInputToolsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props} />
);

export interface PromptInputSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const PromptInputSubmit = ({ className, children, ...props }: PromptInputSubmitProps) => (
  <button
    type='submit'
    className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white transition-colors hover:bg-gray-800',
      className
    )}
    {...props}
  >
    {children || <CornerDownLeft className='h-4 w-4' />}
  </button>
);
