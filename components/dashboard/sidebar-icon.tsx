'use client';

import { HugeiconsIcon, type HugeiconsIconProps } from '@hugeicons/react';

import { cn } from '@/lib/utils';

export type SidebarIconType = HugeiconsIconProps['icon'];

type SidebarIconProps = {
  icon: SidebarIconType;
  className?: string;
  size?: number;
};

export function SidebarIcon({ icon, className, size = 20 }: SidebarIconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={1.5}
      className={cn('shrink-0', className)}
    />
  );
}
