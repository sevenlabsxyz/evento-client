'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useVerifyCode } from '@/lib/hooks/useAuth';
import { verifyCodeSchema, type VerifyCodeFormData } from '@/lib/schemas/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { verifyCode, isLoading, error, reset, email } = useVerifyCode();
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = codeValue.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');
    setValue('code', updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (updatedCode.length === 6) {
      handleSubmit(onSubmit)();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      setValue('code', pastedData);
      // Focus the last filled input or the next empty one
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if 6 digits
      if (pastedData.length === 6) {
        handleSubmit(onSubmit)();
      }
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      // In real app, would call resend API here
      setResendTimer(60); // 60 second cooldown
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
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-center text-2xl font-bold'>Check your email</CardTitle>
          <CardDescription className='space-y-2 text-center'>
            <p>We've sent a 6-digit verification code to</p>
            <p className='flex items-center justify-center gap-2 font-medium text-gray-900'>
              <Mail className='h-4 w-4' />
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

          {/* Code Input Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Verification code</label>
              <div className='flex justify-center gap-2'>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={codeValue[index] || ''}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className='h-12 w-12 text-center text-lg font-semibold'
                    disabled={isLoading}
                  />
                ))}
              </div>
              <input type='hidden' {...register('code')} />
              {errors.code && (
                <p className='text-center text-sm text-red-500'>{errors.code.message}</p>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={isLoading || codeValue.length !== 6}>
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

          <div className='space-y-2 text-center'>
            <p className='text-sm text-gray-600'>
              Didn't receive the code?{' '}
              {resendTimer > 0 ? (
                <span className='text-gray-500'>Resend in {resendTimer}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className='font-medium text-blue-600 hover:underline'
                  disabled={isLoading}
                >
                  Resend code
                </button>
              )}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant='ghost'
            className='w-full'
            onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)}
            disabled={isLoading}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to login
          </Button>
        </CardFooter>
      </Card>
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
