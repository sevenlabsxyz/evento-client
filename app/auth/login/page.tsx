'use client';

import { EventoIcon } from '@/components/icons/evento';
import Google from '@/components/icons/google';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoogleLogin, useLogin, useRedirectIfAuthenticated } from '@/lib/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';
import { validateRedirectUrl } from '@/lib/utils/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';

function LoginContent() {
  const t = useTranslations('auth.login');
  const searchParams = useSearchParams();
  const redirectUrl = validateRedirectUrl(searchParams.get('redirect') || '/');
  const { isLoading: isCheckingAuth } = useRedirectIfAuthenticated(redirectUrl);
  const { sendLoginCode, isLoading, error, reset } = useLogin();
  const { loginWithGoogle } = useGoogleLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  if (isCheckingAuth) {
    return (
      <div className='flex min-h-[100dvh] items-center justify-center dark:bg-neutral-950'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-gray-50 p-4 dark:bg-neutral-950'>
      <div className='fixed right-4 top-4 z-50'>
        <ThemeToggle />
      </div>
      <Card className='w-full max-w-sm rounded-3xl'>
        <CardHeader className='space-y-1'>
          <div className='mx-auto flex w-full items-center justify-center'>
            <EventoIcon className='h-14 w-14' />
          </div>
          <CardTitle className='text-center text-xl font-bold'>{t('title')}</CardTitle>
          <CardDescription className='text-center'>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <Alert
              variant='destructive'
              className='dark:border-red-500/40 dark:text-red-400 dark:[&>svg]:text-red-400'
            >
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error.message || t('errorFallback')}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-sm font-medium'>
                {t('emailLabel')}
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
                <Input
                  {...register('email')}
                  id='email'
                  type='email'
                  placeholder={t('emailPlaceholder')}
                  className='bg-gray-50 pl-10 dark:bg-neutral-950'
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              {errors.email && (
                <p className='text-sm text-red-500 dark:text-red-400'>{errors.email.message}</p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full py-6 text-base'
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('sendingCode')}
                </>
              ) : (
                t('continueWithEmail')
              )}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t dark:border-neutral-700' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-white px-2 text-muted-foreground dark:bg-neutral-900'>
                {t('or')}
              </span>
            </div>
          </div>

          <Button
            variant='secondary'
            className='w-full border border-gray-200 py-6 text-base dark:border-neutral-700'
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('redirectingToGoogle')}
              </>
            ) : (
              <>
                <Google className='mr-1 h-5 w-5' />
                {t('continueWithGoogle')}
              </>
            )}
          </Button>

          {/*
            Telegram login is intentionally hidden for now because the current flow is not
            fully functional in production.
          */}
        </CardContent>
      </Card>
      <div className='mx-auto my-4 w-full max-w-xs text-center text-xs tracking-wide text-muted-foreground opacity-75'>
        <p>
          {t.rich('legal', {
            terms: (chunks) => (
              <Link href='/terms' className='underline hover:text-red-600 dark:hover:text-red-400'>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href='/privacy'
                className='underline hover:text-red-600 dark:hover:text-red-400'
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-[100dvh] items-center justify-center dark:bg-neutral-950'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
