'use client';

import { BetaGate } from '@/components/beta-gate';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { hasAccess, isLoading } = useBetaAccess();
  const router = useRouter();

  useEffect(() => {
    if (hasAccess) {
      router.push('/e/hub');
    }
  }, [hasAccess, router]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return <BetaGate />;
}
