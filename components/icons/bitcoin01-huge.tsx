import { Bitcoin01Icon as HugeBitcoin01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

type Bitcoin01HugeIconProps = React.SVGProps<SVGSVGElement> & {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
};

const Bitcoin01HugeIconBase = React.forwardRef<SVGSVGElement, Bitcoin01HugeIconProps>(
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
        icon={HugeBitcoin01Icon}
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

Bitcoin01HugeIconBase.displayName = 'Bitcoin01HugeIcon';

export const Bitcoin01HugeIcon = Bitcoin01HugeIconBase as unknown as LucideIcon;
