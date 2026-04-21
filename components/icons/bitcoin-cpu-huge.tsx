import { BitcoinCpuIcon as HugeBitcoinCpuIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

type BitcoinCpuHugeIconProps = React.SVGProps<SVGSVGElement> & {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
};

const BitcoinCpuHugeIconBase = React.forwardRef<SVGSVGElement, BitcoinCpuHugeIconProps>(
  ({ size = 24, color, strokeWidth = 1.5, absoluteStrokeWidth, className, ...rest }, ref) => {
    const resolvedStrokeWidth =
      typeof strokeWidth === 'number'
        ? strokeWidth
        : typeof strokeWidth === 'string'
          ? Number(strokeWidth)
          : undefined;

    return (
      <HugeiconsIcon
        ref={ref}
        icon={HugeBitcoinCpuIcon}
        size={size}
        color={typeof color === 'string' ? color : undefined}
        strokeWidth={resolvedStrokeWidth}
        absoluteStrokeWidth={absoluteStrokeWidth}
        className={className}
        {...rest}
      />
    );
  }
);

BitcoinCpuHugeIconBase.displayName = 'BitcoinCpuHugeIcon';

export const BitcoinCpuHugeIcon = BitcoinCpuHugeIconBase as unknown as LucideIcon;
