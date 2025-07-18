'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOnboardingState, useOnboardingActions } from '@/lib/stores/onboarding-store';
import { userNeedsOnboarding } from '@/lib/utils/onboarding';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isOnboarding } = useOnboardingState();
  const { startOnboarding } = useOnboardingActions();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Check if user actually needs onboarding
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!userNeedsOnboarding(user)) {
        // User doesn't need onboarding, redirect to home
        router.push('/');
        return;
      }
      
      // User needs onboarding, start it if not already started
      if (!isOnboarding) {
        startOnboarding();
      }
    }
  }, [isAuthenticated, isLoading, user, isOnboarding, startOnboarding, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow />
    </div>
  );
}