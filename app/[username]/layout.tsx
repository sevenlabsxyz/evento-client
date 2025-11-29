'use client';

import { TopBar } from '@/components/top-bar';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UsernameLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOverlaid } = useTopBar();
  const { hasAccess: hasBetaAccess, isLoading: isBetaLoading } = useBetaAccess();

  // Redirect to beta gate if no beta access
  useEffect(() => {
    if (!isBetaLoading && !hasBetaAccess) {
      router.push('/');
    }
  }, [hasBetaAccess, isBetaLoading, router]);

  // Show loading while checking beta access
  if (isBetaLoading || !hasBetaAccess) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <div className={isOverlaid ? '' : 'pt-16'}>{children}</div>
    </>
  );
}
