import { BitcoinEllipseIcon as HugeBitcoinEllipseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

type BitcoinEllipseHugeIconProps = React.SVGProps<SVGSVGElement> & {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
};

const BitcoinEllipseHugeIconBase = React.forwardRef<SVGSVGElement, BitcoinEllipseHugeIconProps>(
  ({ size = 24, color, strokeWidth, absoluteStrokeWidth, className, ...rest }, ref) => {
    const resolvedStrokeWidth =
      typeof strokeWidth === 'number'
        ? strokeWidth
        : typeof strokeWidth === 'string'
          ? Number(strokeWidth)
          : undefined;

    return (
      <HugeiconsIcon
        ref={ref}
        icon={HugeBitcoinEllipseIcon}
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

BitcoinEllipseHugeIconBase.displayName = 'BitcoinEllipseHugeIcon';

export const BitcoinEllipseHugeIcon = BitcoinEllipseHugeIconBase as unknown as LucideIcon;
