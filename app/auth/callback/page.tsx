'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { getOnboardingRedirectUrl, isUserOnboarded, validateRedirectUrl } from '@/lib/utils/auth';
import { logger } from '@/lib/utils/logger';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const getRedirectUrl = (url: URL, hashParams: URLSearchParams): string => {
        const candidate =
          url.searchParams.get('redirect') ||
          url.searchParams.get('next') ||
          url.searchParams.get('redirectTo') ||
          hashParams.get('redirect') ||
          hashParams.get('next') ||
          '/';

        return validateRedirectUrl(candidate);
      };

      try {
        const callbackUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
        const redirectUrl = getRedirectUrl(callbackUrl, hashParams);
        const oauthError = callbackUrl.searchParams.get('error');
        const oauthErrorDescription = callbackUrl.searchParams.get('error_description');

        if (oauthError) {
          throw new Error(oauthErrorDescription || oauthError);
        }

        const supabase = createClient();
        const code = callbackUrl.searchParams.get('code');
        const searchAccessToken = callbackUrl.searchParams.get('access_token');
        const searchRefreshToken = callbackUrl.searchParams.get('refresh_token');
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw new Error(exchangeError.message);
          }
        } else {
          const accessToken = searchAccessToken || hashAccessToken;
          const refreshToken = searchRefreshToken || hashRefreshToken;

          if (accessToken && refreshToken) {
            localStorage.setItem(STORAGE_KEYS.SUPABASE_ACCESS_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEYS.SUPABASE_REFRESH_TOKEN, refreshToken);

            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              throw new Error(setSessionError.message);
            }
          }
        }

        let user = await authService.getCurrentUser();

        if (!user) {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            await wait(400);
            user = await authService.getCurrentUser();
            if (user) {
              break;
            }
          }
        }

        if (!user) {
          throw new Error('No authentication found');
        }

        setUser(user);
        setStatus('success');

        const needsOnboarding = !isUserOnboarded(user);

        setTimeout(() => {
          if (needsOnboarding) {
            router.push(getOnboardingRedirectUrl(redirectUrl));
          } else {
            router.push(redirectUrl);
          }
        }, 1200);
      } catch (error) {
        logger.error('Auth callback error', {
          error: error instanceof Error ? error.message : String(error),
        });
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');

        // Redirect to login after error, preserving the redirect parameter
        setTimeout(() => {
          const callbackUrl = new URL(window.location.href);
          const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
          const redirect =
            callbackUrl.searchParams.get('redirect') ||
            callbackUrl.searchParams.get('next') ||
            hashParams.get('redirect') ||
            hashParams.get('next');
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
