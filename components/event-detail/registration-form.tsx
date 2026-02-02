'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSubmitRegistration } from '@/lib/hooks/use-submit-registration';
import type { RegistrationQuestion } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface RegistrationFormProps {
  eventId: string;
  questions: RegistrationQuestion[];
  onSuccess: (autoApproved: boolean) => void;
  onCancel: () => void;
}

export function RegistrationForm({
  eventId,
  questions,
  onSuccess,
  onCancel,
}: RegistrationFormProps) {
  const { user } = useAuth();
  const submitRegistration = useSubmitRegistration();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Check if authenticated user email matches
    if (user?.email && email.toLowerCase() !== user.email.toLowerCase()) {
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

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
      question_id: questionId,
      answer: Array.isArray(value) ? value.join(', ') : value,
    }));

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

      onSuccess(result.auto_approved);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit registration. Please try again.';
      toast.error(message);
    }
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
        <Button
          variant='outline'
          onClick={onCancel}
          className='flex-1'
          disabled={submitRegistration.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className='flex-1 bg-red-500 hover:bg-red-600'
          disabled={submitRegistration.isPending}
        >
          {submitRegistration.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Submitting...
            </>
          ) : (
            'Register'
          )}
        </Button>
      </div>
    </div>
  );
}
