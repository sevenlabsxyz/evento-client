import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { clearAllAppStorage } from '@/lib/utils/logout-cleanup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/auth-store';
import { createClient } from '../supabase/client';
import { ApiError } from '../types/api';
import { getOnboardingRedirectUrl, isUserOnboarded, validateRedirectUrl } from '../utils/auth';
// import { debugLog } from '../utils/debug';

// Key for user query
const USER_QUERY_KEY = ['auth', 'user'] as const;

/**
 * Main auth hook that provides authentication state and actions
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, email, setUser, setEmail, clearAuth } = useAuthStore();

  // Query to check current auth status
  const {
    data: userData,
    isLoading: isCheckingAuth,
    error: authError,
    refetch: checkAuth,
  } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Sync user data with store
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (authError) {
      // Clear auth on 401 errors
      // Cast through `unknown` first to avoid the direct `Error` → `ApiError` assertion warning
      const apiError = authError as unknown as ApiError;
      if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        clearAuth();
      }
    }
  }, [userData, authError, setUser, clearAuth]);

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
    onSuccess: () => {
      // Clear auth store
      clearAuth();

      // Clear all app storage (except beta access)
      clearAllAppStorage();

      // Clear ALL React Query cache to prevent stale data
      queryClient.clear();

      // Redirect to login
      router.push('/auth/login');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isCheckingAuth,
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
      console.log('Verify: Code verification successful, user data:', data);

      // Clear email from store
      clearEmail();

      // Invalidate user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      // Get the current user data from the backend to check onboarding status
      try {
        console.log('Verify: Fetching user data to check onboarding status');
        const userData = await authService.getCurrentUser();
        console.log('Verify: User data received:', userData);

        // Set FULL user data from backend in store before redirecting
        // This prevents the flash where stale/minimal data triggers wrong redirects
        if (userData) {
          setUser(userData);
        }

        // Check if user has completed onboarding
        const isOnboarded = isUserOnboarded(userData);
        console.log('Verify: User onboarding status:', isOnboarded);
        console.log('Verify: Username:', userData?.username, 'Name:', userData?.name);

        // Get and validate redirect URL from search params
        const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');
        console.log('Verify: Redirect URL:', redirectUrl);

        if (!isOnboarded) {
          // User needs onboarding - redirect to onboarding with original redirect
          const onboardingUrl = getOnboardingRedirectUrl(redirectUrl);
          console.log('Verify: User not onboarded, redirecting to:', onboardingUrl);
          router.push(onboardingUrl);
        } else {
          // User is onboarded - redirect to intended destination
          console.log('Verify: User is onboarded, redirecting to:', redirectUrl);
          router.push(redirectUrl);
        }
      } catch (error) {
        console.error('Verify: Failed to check onboarding status:', error);
        // On error, set minimal Supabase data as fallback and proceed
        setUser(data);
        const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');
        console.log('Verify: Error occurred, redirecting to default:', redirectUrl);
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

/**
 * Hook to protect routes - redirects to login if not authenticated
 * Also checks for beta access - redirects to beta gate if no access
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Check for beta access from localStorage
      const hasBetaAccess = localStorage.getItem(STORAGE_KEYS.BETA_ACCESS) === 'granted';

      if (!hasBetaAccess) {
        // No beta access - redirect to beta gate
        router.push('/');
        return;
      }

      // Has beta access but not authenticated - redirect to login
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname]);

  return { isAuthenticated, isLoading };
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
