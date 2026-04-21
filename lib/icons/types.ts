import type * as React from 'react';

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}

export type AppIconComponent = React.ForwardRefExoticComponent<
  Omit<AppIconProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>;

export interface CreateHugeIconOptions {
  displayName?: string;
  size?: string | number;
  strokeWidth?: number;
}
