'use client';

import { UserOnboardingFlow } from '@/components/onboarding';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function OnboardingContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();
  const { hasAccess: hasBetaAccess, isLoading: isBetaLoading } = useBetaAccess();

  // Redirect to beta gate if no beta access
  useEffect(() => {
    if (!isBetaLoading && !hasBetaAccess) {
      router.push('/');
    }
  }, [hasBetaAccess, isBetaLoading, router]);

  const handleOnboardingComplete = () => {
    // The UserOnboardingFlow component handles redirect internally
  };

  if (isBetaLoading || !hasBetaAccess || isLoading || !isAuthenticated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='h-screen w-full max-w-md md:h-auto'>
        <UserOnboardingFlow onSubmit={handleOnboardingComplete} />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
