'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteRegistrationQuestion } from '@/lib/hooks/use-delete-registration-question';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationQuestions } from '@/lib/hooks/use-registration-questions';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import { useUpdateRegistrationQuestion } from '@/lib/hooks/use-update-registration-question';
import { useUpdateRegistrationSettings } from '@/lib/hooks/use-update-registration-settings';
import type { ApprovalMode, RegistrationQuestion } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import {
  ArrowLeft,
  ClipboardList,
  GripVertical,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

type QuestionType = RegistrationQuestion['type'];

export default function RegistrationQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data from API
  const { data: existingEvent, isLoading: isLoadingEvent, error } = useEventDetails(eventId);

  // Get registration settings and questions
  const { data: settings, isLoading: isLoadingSettings } = useRegistrationSettings(eventId);
  const { data: questions, isLoading: isLoadingQuestions } = useRegistrationQuestions(eventId);
  const { data: submissionsData } = useRegistrationSubmissions(eventId);

  // Mutations
  const updateSettings = useUpdateRegistrationSettings();
  const updateQuestion = useUpdateRegistrationQuestion();
  const deleteQuestion = useDeleteRegistrationQuestion();

  const isLoading = isLoadingEvent || isLoadingSettings || isLoadingQuestions;

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-6 p-4'>
          <Skeleton className='h-4 w-3/4' />

          {/* Registration Settings Skeleton */}
          <div className='rounded-2xl bg-gray-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
            </div>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4'
                >
                  <div className='space-y-1'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                  <Skeleton className='h-6 w-12 rounded-full' />
                </div>
              ))}
            </div>
          </div>

          {/* Information Section Skeleton */}
          <div className='rounded-2xl bg-blue-50 p-4'>
            <Skeleton className='mb-2 h-5 w-40' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='mt-1 h-4 w-2/3' />
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const registrationRequired = settings?.registration_required ?? false;
  const approvalMode = settings?.approval_mode ?? 'manual';
  const questionList = questions ?? [];
  const pendingCount = submissionsData?.counts?.pending ?? 0;

  const handleToggleRegistrationRequired = async () => {
    try {
      await updateSettings.mutateAsync({
        eventId,
        registration_required: !registrationRequired,
      });
      toast.success(registrationRequired ? 'Registration disabled' : 'Registration enabled');
    } catch {
      toast.error('Failed to update registration settings');
    }
  };

  const handleApprovalModeChange = async (mode: ApprovalMode) => {
    try {
      await updateSettings.mutateAsync({
        eventId,
        approval_mode: mode,
      });
      toast.success(`Approval mode set to ${mode === 'auto' ? 'automatic' : 'manual'}`);
    } catch {
      toast.error('Failed to update approval mode');
    }
  };

  const handleAddQuestion = () => {
    router.push(`/e/${eventId}/manage/registration/types`);
  };

  const handleToggleEnabled = async (questionId: string, currentEnabled: boolean) => {
    try {
      await updateQuestion.mutateAsync({
        eventId,
        questionId,
        is_enabled: !currentEnabled,
      });
      toast.success(currentEnabled ? 'Question disabled' : 'Question enabled');
    } catch {
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await deleteQuestion.mutateAsync({ eventId, questionId });
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handleEditQuestion = (questionId: string) => {
    const question = questionList.find((q) => q.id === questionId);
    if (question) {
      router.push(`/e/${eventId}/manage/registration/edit/${question.type}?id=${questionId}`);
    }
  };

  const handleViewSubmissions = () => {
    router.push(`/e/${eventId}/manage/registration/submissions`);
  };

  const getQuestionIcon = (type: QuestionType) => {
    const icons: Record<QuestionType, string> = {
      text: '📝',
      long_text: '📄',
      single_select: '📋',
      multi_select: '☑️',
      url: '🔗',
      phone: '📞',
      checkbox: '✅',
      instagram: '📷',
      twitter: '🐦',
      youtube: '📺',
      linkedin: '💼',
      company: '🏢',
    };
    return icons[type] || '❓';
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    const labels: Record<QuestionType, string> = {
      text: 'Text',
      long_text: 'Long Text',
      single_select: 'Single Select',
      multi_select: 'Multi Select',
      url: 'URL',
      phone: 'Phone Number',
      checkbox: 'Checkbox',
      instagram: 'Instagram',
      twitter: 'X (Twitter)',
      youtube: 'YouTube',
      linkedin: 'LinkedIn',
      company: 'Company',
    };
    return labels[type] || type;
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 p-4'>
        <div className='flex items-center gap-4'>
          <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h1 className='text-xl font-semibold'>Registration</h1>
        </div>
        <button onClick={handleAddQuestion} className='rounded-full p-2 hover:bg-gray-100'>
          <Plus className='h-6 w-6' />
        </button>
      </div>

      {/* Content */}
      <div className='space-y-6 p-4'>
        {/* Registration Toggle */}
        <div className='rounded-2xl bg-gray-50 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100'>
                <ClipboardList className='h-5 w-5 text-purple-600' />
              </div>
              <div>
                <h3 className='font-medium'>Require Registration</h3>
                <p className='text-sm text-gray-500'>Guests must register to RSVP</p>
              </div>
            </div>
            <button
              onClick={handleToggleRegistrationRequired}
              disabled={updateSettings.isPending}
              className={`h-6 w-10 rounded-full transition-colors ${
                registrationRequired ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  registrationRequired ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Approval Mode (only show if registration is enabled) */}
        {registrationRequired && (
          <div className='rounded-2xl bg-gray-50 p-4'>
            <h3 className='mb-3 font-medium'>Approval Mode</h3>
            <div className='space-y-2'>
              <button
                onClick={() => handleApprovalModeChange('auto')}
                disabled={updateSettings.isPending}
                className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                  approvalMode === 'auto'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className='font-medium'>Automatic Approval</div>
                <div className='text-sm text-gray-500'>Registrations are approved immediately</div>
              </button>
              <button
                onClick={() => handleApprovalModeChange('manual')}
                disabled={updateSettings.isPending}
                className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                  approvalMode === 'manual'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className='font-medium'>Manual Approval</div>
                <div className='text-sm text-gray-500'>
                  You review and approve each registration
                </div>
              </button>
            </div>
          </div>
        )}

        {/* View Submissions Button (only show if registration is enabled) */}
        {registrationRequired && (
          <button
            onClick={handleViewSubmissions}
            className='flex w-full items-center justify-between rounded-2xl bg-blue-50 p-4 hover:bg-blue-100'
          >
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100'>
                <Users className='h-5 w-5 text-blue-600' />
              </div>
              <div className='text-left'>
                <h3 className='font-medium'>View Submissions</h3>
                <p className='text-sm text-gray-500'>
                  {pendingCount > 0
                    ? `${pendingCount} pending approval`
                    : 'Review guest registrations'}
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className='rounded-full bg-red-500 px-2.5 py-1 text-sm font-medium text-white'>
                {pendingCount}
              </span>
            )}
          </button>
        )}

        {/* Questions List */}
        {questionList.length > 0 ? (
          <div className='space-y-3'>
            <div className='text-sm text-gray-500'>
              Guests will be asked these questions when they register for your event.
            </div>

            {questionList.map((question) => (
              <div key={question.id} className='rounded-2xl bg-gray-50 p-4'>
                <div className='flex items-start gap-3'>
                  {/* Drag Handle */}
                  <div className='mt-1'>
                    <GripVertical className='h-4 w-4 text-gray-400' />
                  </div>

                  {/* Question Content */}
                  <div className='flex-1'>
                    <div className='mb-2 flex items-center gap-2'>
                      <span className='text-lg'>{getQuestionIcon(question.type)}</span>
                      <span className='rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-500'>
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      {question.is_required && (
                        <span className='rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600'>
                          Required
                        </span>
                      )}
                    </div>

                    <h3 className='mb-1 font-medium text-gray-900'>{question.label}</h3>

                    {question.options && (
                      <div className='text-sm text-gray-500'>
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className='flex items-center gap-2'>
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggleEnabled(question.id, question.is_enabled)}
                      disabled={updateQuestion.isPending}
                      className={`h-6 w-10 rounded-full transition-colors ${
                        question.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${
                          question.is_enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditQuestion(question.id)}
                      className='rounded p-1 hover:bg-gray-200'
                    >
                      <Settings className='h-4 w-4 text-gray-600' />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={deleteQuestion.isPending}
                      className='rounded p-1 hover:bg-red-100'
                    >
                      <Trash2 className='h-4 w-4 text-red-600' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Settings className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>No Registration Questions</h3>
            <p className='mb-6 text-sm text-gray-500'>
              Add questions to collect information from guests when they register for your event.
            </p>
            <button
              onClick={handleAddQuestion}
              className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600'
            >
              Add Question
            </button>
          </div>
        )}

        {/* Information Section */}
        <div className='rounded-2xl bg-blue-50 p-4'>
          <h4 className='mb-2 font-medium text-blue-900'>Registration Questions</h4>
          <p className='text-sm text-blue-700'>
            Use registration questions to collect specific information from your guests. You can
            make questions required or optional, and organize them in any order.
          </p>
        </div>
      </div>
    </div>
  );
}
