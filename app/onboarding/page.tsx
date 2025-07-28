'use client';

import { UserOnboardingFlow } from '@/components/onboarding';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function OnboardingContent() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  
  const handleOnboardingComplete = () => {
    // The UserOnboardingFlow component handles redirect internally
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md h-screen md:h-auto">
        <UserOnboardingFlow onSubmit={handleOnboardingComplete} />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}