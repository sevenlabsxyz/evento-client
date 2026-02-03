'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RegistrationOtpInputProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onBack: () => void;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function RegistrationOtpInput({
  email,
  onVerify,
  onBack,
  onResend,
  isLoading,
  error,
}: RegistrationOtpInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, '').slice(-1);

      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      // Auto-advance to next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when complete
      if (digit && index === 5) {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          onVerify(fullCode);
        }
      }
    },
    [code, onVerify]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!code[index] && index > 0) {
          // Move to previous input if current is empty
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

      if (pastedData) {
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
          newCode[i] = pastedData[i];
        }
        setCode(newCode);

        // Focus the next empty input or the last one
        const nextEmptyIndex = newCode.findIndex((c) => !c);
        inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();

        // Auto-submit if complete
        if (pastedData.length === 6) {
          onVerify(pastedData);
        }
      }
    },
    [code, onVerify]
  );

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onVerify(fullCode);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onBack}
          className='rounded-full p-2 hover:bg-gray-100'
          disabled={isLoading}
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <div>
          <h2 className='text-lg font-semibold'>Verify your email</h2>
          <p className='text-sm text-gray-500'>
            Enter the 6-digit code sent to <span className='font-medium'>{email}</span>
          </p>
        </div>
      </div>

      {/* OTP Inputs */}
      <div className='flex justify-center gap-2'>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={cn(
              'h-12 w-12 rounded-lg border text-center text-xl font-semibold',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-red-500' : 'border-gray-300'
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && <p className='text-center text-sm text-red-500'>{error}</p>}

      {/* Verify button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading || code.join('').length !== 6}
        className='w-full bg-red-500 hover:bg-red-600'
      >
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Verifying...
          </>
        ) : (
          'Verify & Register'
        )}
      </Button>

      {/* Resend link */}
      <div className='text-center'>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending || isLoading}
          className='text-sm text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive the code? Resend"}
        </button>
      </div>
    </div>
  );
}
