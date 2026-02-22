'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getOnboardingRedirectUrl, isUserOnboarded, validateRedirectUrl } from '@/lib/utils/auth';
import { logger } from '@/lib/utils/logger';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have auth tokens in the URL (for OAuth flow)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (accessToken) {
          // OAuth callback with tokens
          // Store tokens and get user info
          localStorage.setItem(STORAGE_KEYS.SUPABASE_ACCESS_TOKEN, accessToken);
          if (refreshToken) {
            localStorage.setItem(STORAGE_KEYS.SUPABASE_REFRESH_TOKEN, refreshToken);
          }

          // Give the tokens a moment to be stored, then get user info
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get user info from your backend (now with tokens in localStorage)
          const user = await authService.getCurrentUser();

          if (user) {
            setUser(user);
            setStatus('success');

            // Check if user needs onboarding
            const needsOnboarding = !isUserOnboarded(user);
            const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');

            // Redirect after brief success message
            setTimeout(() => {
              if (needsOnboarding) {
                router.push(getOnboardingRedirectUrl(redirectUrl));
              } else {
                router.push(redirectUrl);
              }
            }, 1500);
          } else {
            throw new Error('Failed to get user information');
          }
        } else {
          // No tokens in URL, might be a regular callback
          // Try to get current user (in case session was established)
          // TODO: On mobile, parse deep link params from Telegram auth when the app returns.
          const user = await authService.getCurrentUser();

          if (user) {
            setUser(user);
            setStatus('success');

            // Check if user needs onboarding
            const needsOnboarding = !isUserOnboarded(user);
            const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');

            setTimeout(() => {
              if (needsOnboarding) {
                router.push(getOnboardingRedirectUrl(redirectUrl));
              } else {
                router.push(redirectUrl);
              }
            }, 1500);
          } else {
            throw new Error('No authentication found');
          }
        }
      } catch (error) {
        logger.error('Auth callback error', {
          error: error instanceof Error ? error.message : String(error),
        });
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');

        // Redirect to login after error, preserving the redirect parameter
        setTimeout(() => {
          const redirect = searchParams.get('redirect');
          router.push(
            redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : '/auth/login'
          );
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, setUser]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-center'>
            {status === 'loading' && 'Completing sign in...'}
            {status === 'success' && 'Welcome back!'}
            {status === 'error' && 'Sign in failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center space-y-4'>
          {status === 'loading' && (
            <>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <p className='text-center text-gray-600'>
                Please wait while we complete your sign in...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className='h-8 w-8 text-green-600' />
              <p className='text-center text-gray-600'>
                Sign in successful! Redirecting to home...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className='h-8 w-8 text-red-600' />
              <p className='text-center text-gray-600'>
                {error || 'An error occurred during sign in'}
              </p>
              <p className='text-center text-sm text-gray-500'>Redirecting to login page...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle className='text-center'>Loading...</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col items-center space-y-4'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <p className='text-center text-gray-600'>Please wait...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
