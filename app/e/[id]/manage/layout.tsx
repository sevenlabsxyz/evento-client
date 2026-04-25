'use client';

import { RestoringSessionState } from '@/components/auth/restoring-session-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuthForPage } from '@/lib/providers/auth-recovery-provider';

export default function ManageEventLayout({ children }: { children: React.ReactNode }) {
  const pageAuth = useRequireAuthForPage();

  if (pageAuth.status === 'recovering') {
    return <RestoringSessionState />;
  }

  if (pageAuth.status === 'checking' || pageAuth.status === 'redirecting') {
    return (
      <div className='flex min-h-screen w-full flex-col bg-white px-4 py-6 md:px-8'>
        <Skeleton className='mb-4 h-8 w-32' />
        <Skeleton className='mb-6 h-5 w-64' />
        <div className='space-y-4'>
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-24 w-full rounded-2xl' />
          <Skeleton className='h-48 w-full rounded-2xl' />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
