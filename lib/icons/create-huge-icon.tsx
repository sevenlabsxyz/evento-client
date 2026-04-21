import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import * as React from 'react';

import type { AppIconComponent, AppIconProps, CreateHugeIconOptions } from '@/lib/icons/types';

const DEFAULT_ICON_SIZE = 24;
const DEFAULT_STROKE_WIDTH = 1.5;

function resolveStrokeWidth(strokeWidth: AppIconProps['strokeWidth']) {
  if (typeof strokeWidth === 'number') return strokeWidth;
  if (typeof strokeWidth === 'string') {
    const parsed = Number(strokeWidth);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function applyFill(icon: IconSvgElement, fill: string | undefined): IconSvgElement {
  if (!fill || fill === 'none') return icon;

  return icon.map(([tag, attrs]) => [
    tag,
    {
      ...attrs,
      fill: attrs.fill ?? fill,
    },
  ]);
}

export function createHugeIcon(
  icon: IconSvgElement,
  options: CreateHugeIconOptions = {}
): AppIconComponent {
  const {
    displayName = 'HugeAppIcon',
    size: defaultSize = DEFAULT_ICON_SIZE,
    strokeWidth: defaultStrokeWidth = DEFAULT_STROKE_WIDTH,
  } = options;

  const HugeAppIcon = React.forwardRef<SVGSVGElement, AppIconProps>(
    (
      {
        size = defaultSize,
        color,
        strokeWidth = defaultStrokeWidth,
        absoluteStrokeWidth,
        className,
        fill,
        ...rest
      },
      ref
    ) => {
      const normalizedColor = typeof color === 'string' ? color : undefined;
      const normalizedFill = typeof fill === 'string' ? fill : undefined;

      return (
        <HugeiconsIcon
          ref={ref}
          icon={applyFill(icon, normalizedFill)}
          size={size}
          color={normalizedColor}
          strokeWidth={resolveStrokeWidth(strokeWidth)}
          absoluteStrokeWidth={absoluteStrokeWidth}
          className={className}
          {...(normalizedFill ? { fill: normalizedFill } : {})}
          {...rest}
        />
      );
    }
  );

  HugeAppIcon.displayName = displayName;

  return HugeAppIcon as AppIconComponent;
}
