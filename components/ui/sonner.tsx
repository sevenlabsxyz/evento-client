'use client';

import { useClientMediaQuery } from '@silk-hq/components';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isDesktop = useClientMediaQuery('(min-width: 768px)');

  return <Sonner position={isDesktop ? 'bottom-right' : 'top-center'} richColors {...props} />;
};

export { Toaster };
