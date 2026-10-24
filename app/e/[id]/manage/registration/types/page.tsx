'use client';

import {
  ArrowLeft,
  Building,
  CheckSquare,
  FileText,
  Instagram,
  Link,
  Linkedin,
  List,
  Phone,
  Square,
  Twitter,
  Type,
  Youtube,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

type QuestionType =
  | 'text'
  | 'long_text'
  | 'single_select'
  | 'multi_select'
  | 'url'
  | 'phone'
  | 'checkbox'
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'company';

interface QuestionTypeOption {
  key: QuestionType;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function ChooseQuestionTypePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const t = useTranslations('manageLegacy');

  const basicQuestions: QuestionTypeOption[] = [
    {
      key: 'text',
      label: t('registration.questionTypes.text'),
      icon: <Type className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'long_text',
      label: t('registration.questionTypes.longText'),
      icon: <FileText className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'single_select',
      label: t('registration.questionTypes.singleSelect'),
      icon: <List className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'multi_select',
      label: t('registration.questionTypes.multiSelect'),
      icon: <CheckSquare className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'url',
      label: 'URL',
      icon: <Link className='h-6 w-6' />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      key: 'phone',
      label: t('registration.questionTypes.phone'),
      icon: <Phone className='h-6 w-6' />,
      iconBg: 'bg-green-100 dark:bg-green-950/60',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      key: 'checkbox',
      label: t('registration.questionTypes.checkbox'),
      icon: <Square className='h-6 w-6' />,
      iconBg: 'bg-yellow-100 dark:bg-yellow-950/60',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  const socialProfileQuestions: QuestionTypeOption[] = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: <Instagram className='h-6 w-6' />,
      iconBg: 'bg-pink-100 dark:bg-pink-950/60',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      icon: <Twitter className='h-6 w-6' />,
      iconBg: 'bg-gray-100 dark:bg-neutral-800',
      iconColor: 'text-gray-600 dark:text-neutral-400',
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: <Youtube className='h-6 w-6' />,
      iconBg: 'bg-red-100 dark:bg-red-950/60',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: <Linkedin className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  const otherQuestions: QuestionTypeOption[] = [
    {
      key: 'company',
      label: t('registration.questionTypes.company'),
      icon: <Building className='h-6 w-6' />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  const handleQuestionTypeSelect = (type: QuestionType) => {
    router.push(`/e/${eventId}/manage/registration/add/${type}`);
  };

  const renderQuestionSection = (title: string, questions: QuestionTypeOption[]) => (
    <section className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
      <h3 className='px-4 pb-1 pt-4 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
        {title}
      </h3>
      <div className='space-y-1'>
        {questions.map((question) => (
          <button
            key={question.key}
            onClick={() => handleQuestionTypeSelect(question.key)}
            className='flex w-full items-center gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
          >
            <div
              className={`h-12 w-12 ${question.iconBg} flex items-center justify-center rounded-xl`}
            >
              <div className={question.iconColor}>{question.icon}</div>
            </div>
            <div className='flex-1 text-left'>
              <h4 className='font-medium text-gray-900 dark:text-neutral-100'>{question.label}</h4>
            </div>
            <div className='text-gray-400 dark:text-neutral-500'>
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='m9 18 6-6-6-6'
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div className='space-y-4 py-4 md:py-6'>
      {/* Header */}
      <div className='flex max-w-2xl items-center gap-3'>
        <button
          onClick={() => router.push(`/e/${eventId}/manage/registration`)}
          className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('registrationTypes.title')}
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('registrationTypes.subtitle')}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-2xl space-y-4'>
        {renderQuestionSection(t('registrationTypes.sections.basic'), basicQuestions)}
        {renderQuestionSection(
          t('registrationTypes.sections.socialProfile'),
          socialProfileQuestions
        )}

        {/* Social Profile Note */}
        <p className='px-1 text-sm text-gray-500 dark:text-neutral-400'>
          {t('registrationTypes.socialNote')}
        </p>

        {renderQuestionSection(t('registrationTypes.sections.other'), otherQuestions)}
      </div>
    </div>
  );
}
