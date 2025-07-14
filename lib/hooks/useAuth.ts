import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { authService } from '../services/auth';
import { ApiError } from '../types/api';
import { useEffect } from 'react';

// Key for user query
const USER_QUERY_KEY = ['auth', 'user'] as const;

/**
 * Main auth hook that provides authentication state and actions
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    user, 
    isAuthenticated, 
    email,
    setUser, 
    setEmail,
    clearAuth 
  } = useAuthStore();

  // Query to check current auth status
  const { 
    data: userData, 
    isLoading: isCheckingAuth,
    error: authError,
    refetch: checkAuth
  } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync user data with store
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (authError) {
      // Clear auth on 401 errors
      const apiError = authError as ApiError;
      if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
        clearAuth();
      }
    }
  }, [userData, authError, setUser, clearAuth]);

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

  const mutation = useMutation({
    mutationFn: authService.sendLoginCode,
    onSuccess: (_, email) => {
      setEmail(email);
      router.push('/auth/verify');
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
      
      // Redirect to hub
      router.push('/hub');
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
  const loginWithGoogle = () => {
    authService.loginWithGoogle();
  };

  return { loginWithGoogle };
}

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated(redirectTo = '/hub') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}