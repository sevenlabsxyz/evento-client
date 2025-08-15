import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getOnboardingRedirectUrl, isUserOnboarded } from '../utils/auth';
import { useAuth } from './use-auth';

/**
 * Hook to ensure user has completed onboarding before accessing certain pages
 * Redirects to onboarding if user hasn't completed it
 */
export function useRequireOnboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isUserOnboarded(user)) {
      // User needs onboarding, redirect them
      router.push(getOnboardingRedirectUrl(pathname));
    }
  }, [user, isLoading, isAuthenticated, pathname, router]);

  return {
    isLoading,
    isOnboarded: user ? isUserOnboarded(user) : false,
    user,
  };
}
