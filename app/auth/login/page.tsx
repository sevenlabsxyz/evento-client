'use client';

import { EventoIcon } from '@/components/icons/evento';
import Google from '@/components/icons/google';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoogleLogin, useLogin, useRedirectIfAuthenticated } from '@/lib/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import { validateRedirectUrl } from '@/lib/utils/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '';
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated(redirectUrl);
  const { sendLoginCode, isLoading, error, reset } = useLogin();
  const { loginWithGoogle } = useGoogleLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTelegramWidgetReady, setIsTelegramWidgetReady] = useState(false);
  const telegramWidgetContainerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    reset();
    sendLoginCode(data.email);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    loginWithGoogle();
  };

  useEffect(() => {
    const container = telegramWidgetContainerRef.current;
    if (!container || !telegramBotUsername) {
      return;
    }

    setIsTelegramWidgetReady(false);
    container.innerHTML = '';

    const authUrl = new URL('/api/auth/telegram/callback', window.location.origin);
    authUrl.searchParams.set('next', redirectUrl || '/');

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', telegramBotUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-auth-url', authUrl.toString());
    script.onload = () => setIsTelegramWidgetReady(true);
    container.appendChild(script);
  }, [redirectUrl, telegramBotUsername]);

  if (isCheckingAuth) {
    return (
      <div className='flex min-h-[100dvh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-gray-50 p-4'>
      <Card className='w-full max-w-sm rounded-3xl'>
        <CardHeader className='space-y-1'>
          <div className='mx-auto flex w-full items-center justify-center'>
            <EventoIcon className='h-14 w-14' />
          </div>
          <CardTitle className='text-center text-xl font-bold'>Welcome to Evento</CardTitle>
          <CardDescription className='text-center'>Log in or sign up below.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {error.message || 'An error occurred. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  {...register('email')}
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  className='bg-gray-50 pl-10'
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
            </div>

            <Button
              type='submit'
              className='w-full py-6 text-base'
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending code...
                </>
              ) : (
                'Continue with Email'
              )}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-white px-2 text-muted-foreground'>or</span>
            </div>
          </div>

          <Button
            variant='secondary'
            className='w-full border border-gray-200 py-6 text-base'
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Redirecting to Google...
              </>
            ) : (
              <>
                <Google className='mr-1 h-5 w-5' />
                Continue with Google
              </>
            )}
          </Button>

          <div className='space-y-2'>
            <div className='flex min-h-[56px] items-center justify-center rounded-xl bg-[#2AABEE]'>
              {!isTelegramWidgetReady && (
                <span className='inline-flex items-center gap-2 text-base text-white'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Loading Telegram...
                </span>
              )}
              <div
                ref={telegramWidgetContainerRef}
                className={isTelegramWidgetReady ? 'block' : 'hidden'}
              />
            </div>
            {!telegramBotUsername && (
              <p className='text-center text-xs text-red-500'>
                NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className='mx-auto my-4 w-full max-w-xs text-center text-xs tracking-wide text-muted-foreground opacity-75'>
        <p>
          By continuing to use this app, you agree to Evento&apos;s{' '}
          <Link href='/terms' className='underline hover:text-red-600'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='underline hover:text-red-600'>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-[100dvh] items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
