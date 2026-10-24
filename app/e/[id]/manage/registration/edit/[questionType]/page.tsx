'use client';

import { Button } from '@/components/ui/button';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUpdateRegistrationQuestion } from '@/lib/hooks/use-update-registration-question';
import type { RegistrationQuestionType } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import {
  ArrowLeft,
  Building,
  CheckSquare,
  FileText,
  Instagram,
  Link,
  Linkedin,
  List,
  Loader2,
  Phone,
  Square,
  Twitter,
  Type,
  Youtube,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface QuestionConfig {
  type: RegistrationQuestionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  hasOptions?: boolean;
  autoNote?: string;
}

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const questionType = params.questionType as RegistrationQuestionType;
  const questionId = searchParams.get('id');

  const { data: settings, isLoading: isLoadingSettings } = useRegistrationSettings(eventId);
  const updateQuestion = useUpdateRegistrationQuestion();

  const [questionLabel, setQuestionLabel] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(['']);
  const [isInitialized, setIsInitialized] = useState(false);

  const questionConfigs: Record<RegistrationQuestionType, QuestionConfig> = {
    text: {
      type: 'text',
      label: 'Text',
      description: 'Collect a short, single-line answer',
      icon: <Type className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    long_text: {
      type: 'long_text',
      label: 'Long Text',
      description: 'Collect a longer, multi-line answer',
      icon: <FileText className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    single_select: {
      type: 'single_select',
      label: 'Single Select',
      description: 'Let guests choose one option from a list',
      icon: <List className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hasOptions: true,
    },
    multi_select: {
      type: 'multi_select',
      label: 'Multi Select',
      description: 'Let guests choose multiple options from a list',
      icon: <CheckSquare className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hasOptions: true,
    },
    url: {
      type: 'url',
      label: 'URL',
      description: 'Collect a website or link',
      icon: <Link className='h-6 w-6' />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    phone: {
      type: 'phone',
      label: 'Phone Number',
      description: 'Collect a phone number',
      icon: <Phone className='h-6 w-6' />,
      iconBg: 'bg-green-100 dark:bg-green-950/60',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    checkbox: {
      type: 'checkbox',
      label: 'Checkbox',
      description: 'Get a yes/no or agree/disagree response',
      icon: <Square className='h-6 w-6' />,
      iconBg: 'bg-yellow-100 dark:bg-yellow-950/60',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    instagram: {
      type: 'instagram',
      label: 'Instagram',
      description: "Get the guest's Instagram username",
      icon: <Instagram className='h-6 w-6' />,
      iconBg: 'bg-pink-100 dark:bg-pink-950/60',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    twitter: {
      type: 'twitter',
      label: 'X (Twitter)',
      description: "Get the guest's X (Twitter) handle",
      icon: <Twitter className='h-6 w-6' />,
      iconBg: 'bg-gray-100 dark:bg-neutral-800',
      iconColor: 'text-gray-600 dark:text-neutral-400',
    },
    youtube: {
      type: 'youtube',
      label: 'YouTube',
      description: "Get the guest's YouTube channel",
      icon: <Youtube className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    linkedin: {
      type: 'linkedin',
      label: 'LinkedIn',
      description: "Get the guest's LinkedIn profile",
      icon: <Linkedin className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    company: {
      type: 'company',
      label: 'Company',
      description: 'Get the company the guest works for',
      icon: <Building className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      autoNote: "We'll automatically pull this information if they've entered it on Evento before.",
    },
  };

  const config = questionConfigs[questionType];

  // Find the existing question from settings
  const existingQuestion = settings?.questions?.find((q) => q.id === questionId);

  // Initialize form with existing question data
  useEffect(() => {
    if (existingQuestion && !isInitialized) {
      setQuestionLabel(existingQuestion.label);
      setIsRequired(existingQuestion.is_required);
      if (existingQuestion.options && existingQuestion.options.length > 0) {
        setOptions(existingQuestion.options);
      }
      setIsInitialized(true);
    }
  }, [existingQuestion, isInitialized]);

  const handleSave = async () => {
    if (!questionId) return;

    const filteredOptions = options.filter((o) => o.trim());

    try {
      await updateQuestion.mutateAsync({
        eventId,
        questionId,
        label: questionLabel.trim(),
        options: config?.hasOptions ? filteredOptions : undefined,
        is_required: isRequired,
      });
      toast.success('Question updated');
      router.push(`/e/${eventId}/manage/registration`);
    } catch {
      toast.error('Failed to update question');
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const isFormValid =
    questionLabel.trim() !== '' && (!config?.hasOptions || options.some((o) => o.trim() !== ''));

  // Loading state
  if (isLoadingSettings) {
    return (
      <div className='flex items-center justify-center py-16'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-400 dark:text-neutral-500' />
      </div>
    );
  }

  // Question not found
  if (!questionId || (!isLoadingSettings && !existingQuestion)) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            Question Not Found
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            The question you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push(`/e/${eventId}/manage/registration`)}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Invalid question type
  if (!config) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            Invalid Question Type
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            The question type you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4 md:py-6'>
      {/* Header */}
      <div className='flex max-w-2xl items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => router.push(`/e/${eventId}/manage/registration`)}
            className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            Edit Question
          </h2>
        </div>
        <Button
          onClick={handleSave}
          className={`rounded-full px-6 py-2 font-medium transition-all ${
            isFormValid && !updateQuestion.isPending
              ? 'bg-black text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
              : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-neutral-600 dark:text-neutral-400'
          }`}
          disabled={!isFormValid || updateQuestion.isPending}
        >
          {updateQuestion.isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>

      {/* Content */}
      <div className='max-w-2xl space-y-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:p-6'>
        {/* Question Type Header */}
        <div className='flex items-center gap-4'>
          <div className={`h-12 w-12 ${config.iconBg} flex items-center justify-center rounded-xl`}>
            <div className={config.iconColor}>{config.icon}</div>
          </div>
          <div>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {config.label}
            </h3>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>{config.description}</p>
          </div>
        </div>

        {/* Question Label Input */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700 dark:text-neutral-300'>
            Question Label
          </label>
          <input
            type='text'
            value={questionLabel}
            onChange={(e) => setQuestionLabel(e.target.value)}
            placeholder='Enter your question'
            className='w-full rounded-xl border border-gray-300 p-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:caret-neutral-100 dark:placeholder:text-neutral-500'
          />
        </div>

        {/* Auto Note for social profiles and company */}
        {config.autoNote && (
          <div className='rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40'>
            <p className='text-sm text-blue-700 dark:text-blue-400'>{config.autoNote}</p>
          </div>
        )}

        {/* Options for select types */}
        {config.hasOptions && (
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700 dark:text-neutral-300'>
              Options
            </label>
            {options.map((option, index) => (
              <div key={index} className='flex gap-2'>
                <input
                  type='text'
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className='flex-1 rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:caret-neutral-100 dark:placeholder:text-neutral-500'
                />
                {options.length > 1 && (
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className='rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className='w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300'
            >
              + Add Option
            </button>
          </div>
        )}

        {/* Required Toggle */}
        <div className='flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-neutral-800'>
          <div>
            <h3 className='font-medium text-gray-900 dark:text-neutral-100'>Required</h3>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              Guests must answer this question to register
            </p>
          </div>
          <button
            onClick={() => setIsRequired(!isRequired)}
            className={`h-6 w-12 rounded-full transition-colors ${
              isRequired ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-300 dark:bg-neutral-600'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform dark:bg-neutral-900 ${
                isRequired ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
