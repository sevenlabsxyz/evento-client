import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { isUserOnboarded, validateRedirectUrl } from '../utils/auth';

/**
 * Hook to guard the onboarding page
 * Redirects users who have already completed onboarding
 */
export function useOnboardingGuard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && user && isUserOnboarded(user)) {
      // User is already onboarded, redirect them away
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = validateRedirectUrl(params.get('redirect') || '/');
      router.push(redirectUrl);
    }
  }, [user, isLoading, router]);
  
  return { isLoading, needsOnboarding: user && !isUserOnboarded(user) };
}