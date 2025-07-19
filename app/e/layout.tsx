'use client';

import { TopBar } from '@/components/top-bar';
import { useTopBar } from '@/lib/stores/topbar-store';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { isOverlaid } = useTopBar();

  return (
    <>
      <TopBar />
      <div className={isOverlaid ? '' : 'pt-16'}>{children}</div>
    </>
  );
}
