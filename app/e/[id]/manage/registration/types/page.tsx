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

  const basicQuestions: QuestionTypeOption[] = [
    {
      key: 'text',
      label: 'Text',
      icon: <Type className='h-6 w-6' />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      key: 'long_text',
      label: 'Long Text',
      icon: <FileText className='h-6 w-6' />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      key: 'single_select',
      label: 'Single Select',
      icon: <List className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      key: 'multi_select',
      label: 'Multi Select',
      icon: <CheckSquare className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      key: 'url',
      label: 'URL',
      icon: <Link className='h-6 w-6' />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      icon: <Phone className='h-6 w-6' />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      key: 'checkbox',
      label: 'Checkbox',
      icon: <Square className='h-6 w-6' />,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  const socialProfileQuestions: QuestionTypeOption[] = [
    {
      key: 'instagram',
      label: 'Instagram',
      icon: <Instagram className='h-6 w-6' />,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      icon: <Twitter className='h-6 w-6' />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: <Youtube className='h-6 w-6' />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: <Linkedin className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  const otherQuestions: QuestionTypeOption[] = [
    {
      key: 'company',
      label: 'Company',
      icon: <Building className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  const handleQuestionTypeSelect = (type: QuestionType) => {
    router.push(`/e/${eventId}/manage/registration/add/${type}`);
  };

  const renderQuestionSection = (title: string, questions: QuestionTypeOption[]) => (
    <div className='mb-6'>
      <h3 className='mb-3 px-4 text-sm font-medium text-gray-500'>{title}</h3>
      <div className='space-y-1'>
        {questions.map((question) => (
          <button
            key={question.key}
            onClick={() => handleQuestionTypeSelect(question.key)}
            className='flex w-full items-center gap-4 p-4 transition-colors hover:bg-gray-50'
          >
            <div
              className={`h-12 w-12 ${question.iconBg} flex items-center justify-center rounded-xl`}
            >
              <div className={question.iconColor}>{question.icon}</div>
            </div>
            <div className='flex-1 text-left'>
              <h4 className='font-medium text-gray-900'>{question.label}</h4>
            </div>
            <div className='text-gray-400'>
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
    </div>
  );

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center gap-4 border-b border-gray-100 p-4'>
        <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h1 className='text-xl font-semibold'>Choose Question Type</h1>
      </div>

      {/* Content */}
      <div className='py-4'>
        {renderQuestionSection('Basic', basicQuestions)}
        {renderQuestionSection('Social Profile', socialProfileQuestions)}

        {/* Social Profile Note */}
        <div className='mb-6 px-4'>
          <p className='text-sm text-gray-500'>
            We will retrieve the information automatically if the guest has set it on their Luma
            profile.
          </p>
        </div>

        {renderQuestionSection('Other', otherQuestions)}
      </div>
    </div>
  );
}
