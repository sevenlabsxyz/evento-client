'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubmitRegistration } from '@/lib/hooks/use-submit-registration';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { authService } from '@/lib/services/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { RegistrationQuestion, UserRegistration } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { generateAvailableUsername } from '@/lib/utils/username';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RegistrationOtpInput } from './registration-otp-input';

type FormView = 'form' | 'otp';

interface RegistrationFormProps {
  eventId: string;
  questions: RegistrationQuestion[];
  onSuccess: (autoApproved: boolean, registration?: UserRegistration) => void;
  onCancel: () => void;
}

export function RegistrationForm({
  eventId,
  questions,
  onSuccess,
  onCancel,
}: RegistrationFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const submitRegistration = useSubmitRegistration();
  const updateProfile = useUpdateUserProfile();

  // View state for multi-step form
  const [view, setView] = useState<FormView>('form');

  // Form data
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP state
  const [otpError, setOtpError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const updateAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const toggleMultiSelectOption = (questionId: string, option: string) => {
    const currentValue = (answers[questionId] as string[]) || [];
    const newValue = currentValue.includes(option)
      ? currentValue.filter((v) => v !== option)
      : [...currentValue, option];
    updateAnswer(questionId, newValue);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Check if authenticated user email matches (only for authenticated users)
    if (isAuthenticated && user?.email && email.toLowerCase() !== user.email.toLowerCase()) {
      newErrors.email = 'Email must match your account email';
    }

    // Validate required questions
    for (const question of questions) {
      if (question.is_required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.id] = 'This field is required';
        } else if (typeof answer === 'string' && !answer.trim()) {
          newErrors[question.id] = 'This field is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format answers for API submission
  const formatAnswersForApi = () => {
    return Object.entries(answers).map(([questionId, value]) => ({
      question_id: questionId,
      answer: Array.isArray(value) ? value.join(', ') : value,
    }));
  };

  // Submit registration (called when authenticated)
  const submitRegistrationData = async () => {
    const formattedAnswers = formatAnswersForApi();

    try {
      const result = await submitRegistration.mutateAsync({
        eventId,
        email: email.trim(),
        name: name.trim(),
        answers: formattedAnswers,
      });

      if (result.auto_approved) {
        toast.success("You're registered! You're going to the event.");
      } else {
        toast.success('Registration submitted. Awaiting host approval.');
      }

      // Pass the registration data to parent so it can display status immediately
      // without waiting for a refetch
      onSuccess(result.auto_approved, {
        id: result.registration_id,
        event_id: eventId,
        email: email.trim(),
        name: name.trim(),
        approval_status: result.auto_approved ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit registration. Please try again.';
      toast.error(message);
      throw error; // Re-throw so outer catch can handle it
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    // If user is already authenticated, submit directly
    if (isAuthenticated) {
      await submitRegistrationData();
      return;
    }

    // For non-authenticated users, send OTP and switch to OTP view
    setIsSendingOtp(true);
    try {
      await authService.sendLoginCode(email.trim());
      setView('otp');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send verification code. Please try again.';
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async (code: string) => {
    setIsVerifying(true);
    setOtpError(undefined);

    try {
      // 1. Verify OTP - this creates the user session
      const userData = await authService.verifyCode(email.trim(), code);

      // 2. Invalidate auth query to pick up new session
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });

      // 3. Fetch fresh user data from backend
      const freshUserData = await authService.getCurrentUser();

      // 4. Update the user's name and generate username if needed
      // (for new users or users without a name/username set)
      // Do this BEFORE updating auth state to avoid re-renders
      const userToUse = freshUserData || userData;
      if (userToUse) {
        // Check if we need to update name or generate username
        const needsNameUpdate = !userToUse.name || userToUse.name !== name.trim();
        const needsUsername = !userToUse.username;

        if (needsNameUpdate || needsUsername) {
          try {
            const updates: { name?: string; username?: string } = {};

            if (needsNameUpdate) {
              updates.name = name.trim();
            }

            if (needsUsername) {
              const generatedUsername = await generateAvailableUsername(email.trim(), name.trim());
              updates.username = generatedUsername;
            }

            await updateProfile.mutateAsync(updates);
          } catch (error) {
            // Non-critical - continue with registration even if profile update fails
            logger.warn('Failed to update profile, continuing with registration', { error });
          }
        }
      }

      // 5. Submit registration FIRST (before auth state update)
      // This prevents premature re-renders that reset the form
      await submitRegistrationData();

      // 6. Update auth store AFTER registration succeeds
      // This prevents auth state change from causing component re-render mid-flow
      setUser(userToUse);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Invalid verification code. Please try again.';
      setOtpError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle OTP resend
  const handleOtpResend = async () => {
    try {
      await authService.sendLoginCode(email.trim());
      toast.success('Verification code sent!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to resend code. Please try again.';
      toast.error(message);
      throw error; // Re-throw to let OTP component handle cooldown
    }
  };

  // Handle back from OTP view
  const handleOtpBack = () => {
    setView('form');
    setOtpError(undefined);
  };

  const renderQuestionField = (question: RegistrationQuestion) => {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'text':
      case 'url':
      case 'phone':
        return (
          <Input
            type={question.type === 'url' ? 'url' : question.type === 'phone' ? 'tel' : 'text'}
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'long_text':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || `Enter ${question.label.toLowerCase()}`}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        );

      case 'single_select':
        return (
          <RadioGroup
            value={value as string}
            onValueChange={(val) => updateAnswer(question.id, val)}
            className='space-y-2'
          >
            {question.options?.map((option) => (
              <label
                key={option}
                className='flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50'
              >
                <RadioGroupItem value={option} />
                <span className='text-sm'>{option}</span>
              </label>
            ))}
          </RadioGroup>
        );

      case 'multi_select':
        const selectedOptions = (value as string[]) || [];
        return (
          <div className='space-y-2'>
            {question.options?.map((option) => (
              <label
                key={option}
                className='flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50'
              >
                <Checkbox
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={() => toggleMultiSelectOption(question.id, option)}
                />
                <span className='text-sm'>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className='flex cursor-pointer items-center gap-3'>
            <Checkbox
              checked={value === 'true'}
              onCheckedChange={(checked) => updateAnswer(question.id, checked ? 'true' : '')}
            />
            <span className='text-sm text-gray-600'>{question.placeholder || 'I agree'}</span>
          </label>
        );

      case 'instagram':
      case 'twitter':
      case 'youtube':
      case 'linkedin':
        const prefixes: Record<string, string> = {
          instagram: '@',
          twitter: '@',
          youtube: '',
          linkedin: '',
        };
        const placeholders: Record<string, string> = {
          instagram: 'username',
          twitter: 'username',
          youtube: 'channel URL or username',
          linkedin: 'profile URL or username',
        };
        return (
          <div className='flex items-center'>
            {prefixes[question.type] && (
              <span className='rounded-l-md border border-r-0 bg-gray-100 px-3 py-2 text-gray-500'>
                {prefixes[question.type]}
              </span>
            )}
            <Input
              value={value as string}
              onChange={(e) => updateAnswer(question.id, e.target.value)}
              placeholder={question.placeholder || placeholders[question.type]}
              className={`${prefixes[question.type] ? 'rounded-l-none' : ''} ${error ? 'border-red-500' : ''}`}
            />
          </div>
        );

      case 'company':
        return (
          <Input
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || 'Company name'}
            className={error ? 'border-red-500' : ''}
          />
        );

      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  // Show OTP verification view
  if (view === 'otp') {
    return (
      <RegistrationOtpInput
        email={email.trim()}
        onVerify={handleOtpVerify}
        onBack={handleOtpBack}
        onResend={handleOtpResend}
        isLoading={isVerifying || submitRegistration.isPending}
        error={otpError}
      />
    );
  }

  // Show registration form
  const isSubmitting = submitRegistration.isPending || isSendingOtp;

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        {/* Name field */}
        <div>
          <label className='mb-2 block text-sm font-medium'>
            Name <span className='text-red-500'>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.name;
                  return newErrors;
                });
              }
            }}
            placeholder='Your full name'
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className='mt-1 text-sm text-red-500'>{errors.name}</p>}
        </div>

        {/* Email field */}
        <div>
          <label className='mb-2 block text-sm font-medium'>
            Email <span className='text-red-500'>*</span>
          </label>
          <Input
            type='email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.email;
                  return newErrors;
                });
              }
            }}
            placeholder='your@email.com'
            className={errors.email ? 'border-red-500' : ''}
            disabled={!!user?.email}
          />
          {errors.email && <p className='mt-1 text-sm text-red-500'>{errors.email}</p>}
          {user?.email && <p className='mt-1 text-xs text-gray-500'>Using your account email</p>}
          {!isAuthenticated && (
            <p className='mt-1 text-xs text-gray-500'>
              We&apos;ll send a verification code to this email
            </p>
          )}
        </div>

        {/* Custom questions */}
        {questions.map((question) => (
          <div key={question.id}>
            <label className='mb-2 block text-sm font-medium'>
              {question.label}
              {question.is_required && <span className='text-red-500'> *</span>}
            </label>
            {renderQuestionField(question)}
            {errors[question.id] && (
              <p className='mt-1 text-sm text-red-500'>{errors[question.id]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className='flex gap-3'>
        <Button variant='outline' onClick={onCancel} className='flex-1' disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className='flex-1 bg-red-500 hover:bg-red-600'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              {isSendingOtp ? 'Sending code...' : 'Submitting...'}
            </>
          ) : isAuthenticated ? (
            'Register'
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}
