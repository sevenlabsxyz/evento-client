import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/auth-store';
import { createClient } from '../supabase/client';
import { ApiError } from '../types/api';
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

  // Sync user data with store and get email from Supabase
  useEffect(() => {
    if (userData) {
      setUser(userData);
      
      // Get email from Supabase auth if not already set
      if (!email) {
        const getSupabaseEmail = async () => {
          try {
            const supabase = createClient();
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            if (supabaseUser?.email) {
              setEmail(supabaseUser.email);
            }
          } catch (error) {
            console.log('Failed to get email from Supabase:', error);
          }
        };
        getSupabaseEmail();
      }
    } else if (authError) {
      // Clear auth on 401 errors
      const apiError = authError as ApiError;
      if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        clearAuth();
      }
    }
  }, [userData, authError, setUser, setEmail, clearAuth, email]);

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
      clearAuth();
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
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
 * Hook for verifying TOTP code
 */
export function useVerifyCode() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { email, setUser, clearEmail } = useAuthStore();

  const mutation = useMutation({
    mutationFn: ({ code }: { code: string }) => {
      if (!email) {
        throw new Error('Email is required for verification');
      }
      return authService.verifyCode(email, code);
    },
    onSuccess: (data) => {
      // Set user data
      setUser(data);

      // Clear email from store
      clearEmail();

      // Invalidate user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });

      // Redirect to home
      router.push('/');
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
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

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
