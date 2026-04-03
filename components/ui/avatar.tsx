'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { getOptimizedAvatarUrl } from '@/lib/utils/image';

const ABSOLUTE_AVATAR_SRC_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;
const AVATAR_STORAGE_PREFIX_PATTERN = /^(?:storage\/v1\/object\/public\/cdn\/|cdn\/)+/;

function resolveAvatarSrc(src?: string): string | undefined {
  const trimmedSrc = src?.trim();

  if (!trimmedSrc) {
    return undefined;
  }

  if (ABSOLUTE_AVATAR_SRC_PATTERN.test(trimmedSrc)) {
    return trimmedSrc;
  }

  const relativeSrc = trimmedSrc.replace(/^\/+/, '');
  const storageRelativeSrc = relativeSrc.replace(AVATAR_STORAGE_PREFIX_PATTERN, '');

  if (storageRelativeSrc.startsWith('users/')) {
    return getOptimizedAvatarUrl(storageRelativeSrc);
  }

  return trimmedSrc;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    src={resolveAvatarSrc(typeof src === 'string' ? src : undefined)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarFallback, AvatarImage };
