'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/lib/services/auth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallbackPage() {
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
          localStorage.setItem('supabase_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('supabase_refresh_token', refreshToken);
          }
          
          // Give the tokens a moment to be stored, then get user info
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get user info from your backend (now with tokens in localStorage)
          const user = await authService.getCurrentUser();
          
          if (user) {
            setUser(user);
            setStatus('success');
            
            // Redirect to original location or home after brief success message
            setTimeout(() => {
              const redirect = searchParams.get('redirect');
              router.push(redirect || '/');
            }, 1500);
          } else {
            throw new Error('Failed to get user information');
          }
        } else {
          // No tokens in URL, might be a regular callback
          // Try to get current user (in case session was established)
          const user = await authService.getCurrentUser();
          
          if (user) {
            setUser(user);
            setStatus('success');
            setTimeout(() => {
              router.push('/');
            }, 1500);
          } else {
            throw new Error('No authentication found');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to login after error, preserving the redirect parameter
        setTimeout(() => {
          const redirect = searchParams.get('redirect');
          router.push(redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : '/auth/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Completing sign in...'}
            {status === 'success' && 'Welcome back!'}
            {status === 'error' && 'Sign in failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 text-center">
                Please wait while we complete your sign in...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 text-green-600" />
              <p className="text-gray-600 text-center">
                Sign in successful! Redirecting to home...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-8 w-8 text-red-600" />
              <p className="text-gray-600 text-center">
                {error || 'An error occurred during sign in'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                Redirecting to login page...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}