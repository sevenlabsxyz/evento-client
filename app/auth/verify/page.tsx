'use client';

import { EventoIcon } from '@/components/icons/evento';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResendCode, useVerifyCode } from '@/lib/hooks/use-auth';
import { verifyCodeSchema, type VerifyCodeFormData } from '@/lib/schemas/auth';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { verifyCode, isLoading, error, reset, email } = useVerifyCode();
  const {
    resendCode,
    isLoading: isResending,
    error: resendError,
    isSuccess: resendSuccess,
    reset: resetResend,
  } = useResendCode();
  const [resendTimer, setResendTimer] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  const codeValue = watch('code');

  // Redirect to login if no email in store
  useEffect(() => {
    if (!email) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [email, redirectUrl, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const onSubmit = (data: VerifyCodeFormData) => {
    reset(); // Clear any previous errors
    verifyCode({ code: data.code });
  };

  const handleCodeChange = (value: string) => {
    setValue('code', value);

    // Auto-submit when all 6 digits are entered
    if (value.length === 6) {
      handleSubmit(onSubmit)();
    }
  };

  const handleResend = () => {
    if (resendTimer === 0 && !isResending) {
      resetResend(); // Clear any previous errors
      resendCode(undefined, {
        onSuccess: () => {
          setResendTimer(60); // 60 second cooldown
          toast.success('A new verification code has been sent to your email.');
        },
      });
    }
  };

  // Show loading while no email
  if (!email) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4'>
      <div className='mx-auto -mt-12 mb-2 flex w-full max-w-sm opacity-50 hover:opacity-100'>
        <Button
          variant='link'
          className=''
          onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)}
          disabled={isLoading}
        >
          <ArrowLeft className='h-4 w-4' />
          Back to login
        </Button>
      </div>
      <Card className='w-full max-w-sm rounded-3xl'>
        <CardHeader className='space-y-1'>
          <div className='mx-auto flex w-full items-center justify-center'>
            <EventoIcon className='h-14 w-14' />
          </div>
          <CardTitle className='text-center text-xl font-bold'>Check your email</CardTitle>
          <CardDescription className='space-y-2 text-center'>
            <p>We've sent a 6-digit verification code to</p>
            <p className='flex items-center justify-center gap-2 font-medium text-gray-900'>
              {email}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Error Alert */}
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {error.message || 'Invalid code. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Resend Error Alert */}
          {resendError && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {resendError.message || 'Failed to resend code. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Code Input Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Verification code</label>
              <div className='flex justify-center'>
                <InputOTP
                  maxLength={6}
                  value={codeValue}
                  onChange={handleCodeChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                    <InputOTPSlot
                      index={1}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                    <InputOTPSlot
                      index={2}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                    <InputOTPSlot
                      index={4}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                    <InputOTPSlot
                      index={5}
                      className='h-12 w-12 bg-gray-50 text-lg font-semibold'
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <input type='hidden' {...register('code')} />
              {errors.code && (
                <p className='text-center text-sm text-red-500'>{errors.code.message}</p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full py-6 text-base'
              disabled={isLoading || codeValue.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className='my-4 space-y-2 text-center'>
        <p className='text-sm text-gray-600'>
          Didn't receive the code?{' '}
          {resendTimer > 0 ? (
            <span className='text-gray-500'>Resend in {resendTimer}s</span>
          ) : (
            <button
              onClick={handleResend}
              className='font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50'
              disabled={isLoading || isResending}
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
