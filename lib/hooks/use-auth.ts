import { resetWalletInitialization } from '@/lib/hooks/use-wallet';
import { useAuthRecovery, useRequireAuthForPage } from '@/lib/providers/auth-recovery-provider';
import { logger } from '@/lib/utils/logger';
import { clearAllAppStorage } from '@/lib/utils/logout-cleanup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { authService, UnauthenticatedError } from '../services/auth';
import { useAuthStore } from '../stores/auth-store';
import { createClient } from '../supabase/client';
import { ApiError } from '../types/api';
import { getOnboardingRedirectUrl, isUserOnboarded, validateRedirectUrl } from '../utils/auth';
// import { debugLog } from '../utils/debug';

// Key for user query
export const USER_QUERY_KEY = ['auth', 'user'] as const;

export interface UseAuthResult {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  isRecovering?: boolean;
  email: string | null;
  checkAuth: (...args: any[]) => Promise<unknown>;
  logout: (...args: any[]) => void;
  isLoggingOut: boolean;
}

/**
 * Main auth hook that provides authentication state and actions
 */
export function useAuth(): UseAuthResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status: recoveryStatus, reconcileOptionalAuth } = useAuthRecovery();
  const { user, isAuthenticated, email, setUser, setEmail, clearAuth } = useAuthStore();
  const attemptedOptionalRecoveryRef = useRef(false);
  const hasPersistedAuth = isAuthenticated || !!user;

  // Query to check current auth status
  const {
    data: userData,
    isLoading: isCheckingAuth,
    error: authError,
    refetch: checkAuth,
  } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: () => authService.getCurrentUser({ requireSession: hasPersistedAuth }),
    retry: (failureCount, error) => {
      if (error instanceof UnauthenticatedError) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const hasUnauthorizedError = Boolean(
    authError instanceof UnauthenticatedError ||
    (authError &&
      typeof authError === 'object' &&
      'status' in authError &&
      (authError as { status?: number }).status === 401)
  );

  // Sync user data with store
  useEffect(() => {
    if (userData) {
      attemptedOptionalRecoveryRef.current = false;
      setUser(userData);
    } else if (authError && authError instanceof UnauthenticatedError) {
      attemptedOptionalRecoveryRef.current = false;
      clearAuth();
    }
    // Note: we intentionally do NOT clear auth when userData is null.
    // A null return during bootstrap (session exists but backend row
    // not yet created) is expected — the fallback user set by
    // useVerifyCode or the auth callback should persist until the
    // next successful refetch. Confirmed logouts are handled by the
    // UnauthenticatedError / 401 path above.
  }, [userData, authError, setUser, clearAuth]);

  useEffect(() => {
    if (
      !hasPersistedAuth ||
      !authError ||
      !hasUnauthorizedError ||
      authError instanceof UnauthenticatedError ||
      attemptedOptionalRecoveryRef.current
    ) {
      return;
    }

    attemptedOptionalRecoveryRef.current = true;

    reconcileOptionalAuth({ reason: 'optional-auth-probe' })
      .then((result) => {
        if (result.status === 'authenticated') {
          logger.info('Auth: optional auth probe recovered session', { userId: result.user.id });
        } else {
          logger.warn('Auth: optional auth probe downgraded to guest state', {
            status: result.status,
          });
        }
      })
      .catch((error) => {
        logger.warn('Auth: optional auth probe recovery failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, [authError, hasPersistedAuth, hasUnauthorizedError, reconcileOptionalAuth]);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // debugLog('Auth', 'State changed -', event);

      if (event === 'SIGNED_IN' && session) {
        // User signed in - refresh user data
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear everything
        clearAuth();
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed - this is automatic, no action needed
        // debugLog('Auth', 'Token refreshed');
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, clearAuth]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      // Clear auth store
      clearAuth();

      clearAllAppStorage();
      await resetWalletInitialization({ disconnect: true, resetStore: true });

      // Clear ALL React Query cache to prevent stale data
      queryClient.clear();

      // Redirect to login
      router.push('/auth/login');
    },
  });

  const effectiveUser = hasUnauthorizedError ? null : userData || user;
  const effectiveIsAuthenticated = !hasUnauthorizedError && !!effectiveUser;
  const isRecovering = recoveryStatus === 'recovering';
  const showLoading = (!effectiveUser && isCheckingAuth) || isRecovering;

  return {
    user: effectiveUser,
    isAuthenticated: effectiveIsAuthenticated,
    isLoading: showLoading,
    isRecovering,
    email,
    checkAuth,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

/**
 * Hook for handling login flow (sending TOTP code)
 */
export function useLogin() {
  const router = useRouter();
  const { setEmail } = useAuthStore();
  const searchParams = useSearchParams();

  const mutation = useMutation({
    mutationFn: authService.sendLoginCode,
    onSuccess: (_, email) => {
      setEmail(email);
      const redirect = searchParams.get('redirect');
      router.push(
        redirect ? `/auth/verify?redirect=${encodeURIComponent(redirect)}` : '/auth/verify'
      );
    },
  });

  return {
    sendLoginCode: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}

/**
 * Hook for resending verification code
 */
export function useResendCode() {
  const { email } = useAuthStore();

  const mutation = useMutation({
    mutationFn: () => {
      if (!email) {
        throw new Error('Email is required to resend code');
      }
      return authService.sendLoginCode(email);
    },
  });

  return {
    resendCode: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error as ApiError | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}

/**
 * Hook for verifying TOTP code
 */
export function useVerifyCode() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { email, setUser, clearEmail } = useAuthStore();
  const searchParams = useSearchParams();

  const mutation = useMutation({
    mutationFn: ({ code }: { code: string }) => {
      if (!email) {
        throw new Error('Email is required for verification');
      }
      return authService.verifyCode(email, code);
    },
    onSuccess: async (data) => {
      // Clear email from store
      clearEmail();

      // Invalidate user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      // Get the current user data from the backend to check onboarding status
      const { user: userData, settled } = await authService.tryGetCurrentUser();

      // Set user data - prefer backend data, fallback to Supabase data for new users
      // This ensures isAuthenticated is true even for new users not yet in backend
      setUser(userData || data);

      // Get and validate redirect URL from search params
      const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');

      if (settled) {
        // Definitive answer from backend — safe to check onboarding
        const isOnboarded = isUserOnboarded(userData);
        if (!isOnboarded) {
          const onboardingUrl = getOnboardingRedirectUrl(redirectUrl);
          router.push(onboardingUrl);
        } else {
          router.push(redirectUrl);
        }
      } else {
        // Transient miss — don't make onboarding decisions, go to intended destination
        router.push(redirectUrl);
      }
    },
  });

  return {
    verifyCode: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
    email,
  };
}

/**
 * Hook for initiating Google OAuth login
 */
export function useGoogleLogin() {
  const mutation = useMutation({
    mutationFn: authService.loginWithGoogle,
  });

  return {
    loginWithGoogle: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error as ApiError | null,
  };
}

export function useRequireAuth(_redirectTo = '/auth/login') {
  const pageAuth = useRequireAuthForPage();

  return {
    isAuthenticated: pageAuth.status === 'authenticated',
    isLoading:
      pageAuth.status === 'checking' ||
      pageAuth.status === 'recovering' ||
      pageAuth.status === 'redirecting',
  };
}

/**
 * Hook to redirect authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated(redirectTo = '/') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
