'use client';

import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UserSearchPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingAuth) {
      router.replace('/e/messages');
    }
  }, [isCheckingAuth, router]);

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      <div className='flex flex-1 items-center justify-center pb-20'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
      </div>
    </div>
  );
}
