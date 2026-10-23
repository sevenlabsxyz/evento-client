'use client';

import { useClientMediaQuery } from '@silk-hq/components';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isDesktop = useClientMediaQuery('(min-width: 768px)');
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      position={isDesktop ? 'bottom-right' : 'top-center'}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      richColors
      {...props}
    />
  );
};

export { Toaster };
