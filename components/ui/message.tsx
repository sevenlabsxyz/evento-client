import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ComponentProps, HTMLAttributes } from 'react';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: 'user' | 'other';
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end gap-1 py-1',
      from === 'user' ? 'flex-row-reverse' : 'flex-row',
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div className={cn('flex max-w-[70%] flex-col', className)} {...props}>
    <div
      className={cn(
        'break-words rounded-xl px-4 py-3 text-xs',
        'group-[.flex-row-reverse]:bg-blue-500 group-[.flex-row-reverse]:text-white',
        'group-[.flex-row]:bg-gray-100 group-[.flex-row]:text-gray-900'
      )}
    >
      {children}
    </div>
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src?: string;
  name?: string;
};

export const MessageAvatar = ({ src, name, className, ...props }: MessageAvatarProps) => (
  <div className='flex-shrink-0'>
    {src ? (
      <Avatar className={cn('size-8', className)} {...props}>
        <AvatarImage alt='' src={src} />
        <AvatarFallback className='bg-gray-300 text-xs font-medium text-gray-700'>
          {name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    ) : (
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700'>
        {name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    )}
  </div>
);
