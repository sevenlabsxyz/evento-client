'use client';

import {
  isEmailBlastScheduledMutationRaceError,
  useCreateEmailBlastWithCallbacks,
  useUpdateEmailBlast,
} from '@/lib/hooks/use-email-blasts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import {
  CreateEmailBlastForm,
  EmailBlast,
  EmailBlastRecipientFilter,
  UpdateEmailBlastForm,
} from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Send,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import DatePickerSheet from '../create-event/date-picker-sheet';
import TimePickerSheet from '../create-event/time-picker-sheet';
import { Button } from '../ui/button';

interface EmailBlastComposeProps {
  isOpen: boolean;
  eventId: string;
  blastToEdit?: EmailBlast | null;
  onSend: (data: { recipients: string; subject: string; message: string }) => void;
  onStaleScheduledMutationAttempt?: () => void;
  onCancel: () => void;
}

type ComposeStep = 'details' | 'timing' | 'preview';

export default function EmailBlastCompose({
  isOpen,
  eventId,
  blastToEdit,
  onSend,
  onStaleScheduledMutationAttempt,
  onCancel,
}: EmailBlastComposeProps) {
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const [step, setStep] = useState<ComposeStep>('details');
  const [recipients, setRecipients] = useState<EmailBlastRecipientFilter>('all');
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('');

  // State for date/time picker modals
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Format the scheduled date for display
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString(intlLocale, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '';

  // Parse scheduledTime string into hour, minute, period format
  const getTimeComponents = () => {
    if (!scheduledTime) return { hour: 9, minute: 0, period: 'AM' as const };

    const [hourStr, minuteStr] = scheduledTime.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const period = hour >= 12 ? ('PM' as const) : ('AM' as const);

    // Convert 24-hour format to 12-hour format
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return { hour, minute, period };
  };

  // Handle date selection from the date picker
  const handleDateSelect = (date: Date) => {
    const formattedDateStr = date.toISOString().split('T')[0];
    setScheduledDate(formattedDateStr);
    setIsDatePickerOpen(false);
  };

  // Handle time selection from the time picker
  const handleTimeSelect = (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => {
    // Convert to 24-hour format for the input value
    let hour24 = time.hour;
    if (time.period === 'PM' && time.hour < 12) hour24 += 12;
    if (time.period === 'AM' && time.hour === 12) hour24 = 0;

    const timeString = `${hour24.toString().padStart(2, '0')}:${time.minute
      .toString()
      .padStart(2, '0')}`;
    setScheduledTime(timeString);
    setIsTimePickerOpen(false);
  };

  // API hooks
  const createEmailBlastMutation = useCreateEmailBlastWithCallbacks(eventId);
  const updateEmailBlastMutation = useUpdateEmailBlast(eventId, blastToEdit?.id ?? '');
  const { data: rsvps = [], isLoading: isLoadingRSVPs, error: rsvpsError } = useEventRSVPs(eventId);
  const isEditMode = !!blastToEdit;

  useEffect(() => {
    if (rsvpsError) {
      toast.error(t('emailBlast.compose.toasts.rsvpStatsFailed'));
    }
  }, [rsvpsError, t]);

  // Compute counts locally from RSVPs
  const counts = useMemo(() => {
    const all = rsvps?.length || 0;
    const yes_only = (rsvps || []).filter((r) => r.status === 'yes').length;
    const no_only = (rsvps || []).filter((r) => r.status === 'no').length;
    const maybe = (rsvps || []).filter((r) => r.status === 'maybe').length;
    return { all, yes_only, no_only, maybe };
  }, [rsvps]);

  // Dynamic recipient options based on RSVP stats
  const recipientOptions = [
    {
      value: 'all' as const,
      label: t('emailBlast.compose.recipients.all.label'),
      description: (count: number) =>
        isLoadingRSVPs
          ? t('emailBlast.compose.recipients.all.descriptionLoading')
          : t('emailBlast.compose.recipients.all.description', { count }),
      count: counts.all,
    },
    {
      value: 'rsvp-yes' as const,
      label: t('emailBlast.compose.recipients.yes.label'),
      description: (count: number) =>
        isLoadingRSVPs
          ? t('emailBlast.compose.recipients.yes.descriptionLoading')
          : t('emailBlast.compose.recipients.yes.description', { count }),
      count: counts.yes_only,
    },
    {
      value: 'rsvp-no' as const,
      label: t('emailBlast.compose.recipients.no.label'),
      description: (count: number) =>
        isLoadingRSVPs
          ? t('emailBlast.compose.recipients.no.descriptionLoading')
          : t('emailBlast.compose.recipients.no.description', { count }),
      count: counts.no_only,
    },
    {
      value: 'rsvp-maybe' as const,
      label: t('emailBlast.compose.recipients.maybe.label'),
      description: (count: number) =>
        isLoadingRSVPs
          ? t('emailBlast.compose.recipients.maybe.descriptionLoading')
          : t('emailBlast.compose.recipients.maybe.description', { count }),
      count: counts.maybe,
    },
    {
      value: 'invited' as const,
      label: t('emailBlast.compose.recipients.invited.label'),
      description: () => t('emailBlast.compose.recipients.invited.description'),
      count: counts.all,
    },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        link: false,
        bulletList: false,
      }),
      Bold,
      Italic,
      BulletList,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 dark:text-red-400 underline',
        },
      }),
      Placeholder.configure({
        placeholder: t('emailBlast.compose.messagePlaceholder'),
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        'data-testid': 'email-editor',
      },
      handleClick: (view) => {
        // Ensure editor gets focus when clicked
        if (!view.hasFocus()) {
          view.focus();
        }
        return false; // Allow default click behavior
      },
    },
    onUpdate: ({ editor }) => {
      // Update content state when editor content changes
      const content = editor.getText().trim();
      setEditorContent(content);
    },
    onCreate: ({ editor }) => {
      // Focus editor when created
      setTimeout(() => {
        editor.commands.focus();
      }, 100);
    },
  });

  const getDateInputValue = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTimeInputValue = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getSubjectFromMessage = (message: string) =>
    message
      .replace(/<[^>]*>/g, '')
      .split('\n')[0]
      ?.slice(0, 80)
      .trim() || '';

  const getPlainTextFromMessage = (message: string) => message.replace(/<[^>]*>/g, '').trim();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep('details');

    if (blastToEdit) {
      setRecipients(blastToEdit.recipient_filter);
      setSubject(blastToEdit.subject || getSubjectFromMessage(blastToEdit.message));
      setEditorContent(getPlainTextFromMessage(blastToEdit.message));
      setScheduled(true);
      setScheduledDate(
        blastToEdit.scheduled_for ? getDateInputValue(blastToEdit.scheduled_for) : ''
      );
      setScheduledTime(
        blastToEdit.scheduled_for ? getTimeInputValue(blastToEdit.scheduled_for) : ''
      );
      editor?.commands.setContent(blastToEdit.message || '');
    } else {
      setRecipients('all');
      setSubject('');
      setEditorContent('');
      setScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      editor?.commands.setContent('');
    }

    setTimezone('');
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
  }, [isOpen, editor, blastToEdit]);

  const selectedOption = recipientOptions.find((option) => option.value === recipients);

  const handleSend = async () => {
    if (!editor || !subject.trim()) return;

    if (
      (!isEditMode && scheduled && (!scheduledDate || !scheduledTime)) ||
      (isEditMode && (!scheduledDate || !scheduledTime))
    ) {
      toast.error(t('emailBlast.compose.toasts.chooseDateTime'));
      return;
    }

    const message = editor.getHTML();

    try {
      // Calculate scheduled_for date if scheduling is enabled
      let scheduledFor: string | null = null;

      if ((scheduled || isEditMode) && scheduledDate && scheduledTime) {
        try {
          const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
          if (Number.isNaN(scheduledDateTime.getTime())) {
            toast.error(t('emailBlast.compose.toasts.invalidDateTime'));
            return;
          }

          if (scheduledDateTime.getTime() <= Date.now()) {
            toast.error(t('emailBlast.compose.toasts.mustBeFuture'));
            return;
          }

          scheduledFor = scheduledDateTime.toISOString();
        } catch (e) {
          toast.error(t('emailBlast.compose.toasts.invalidDateTime'));
          return;
        }
      }

      if (isEditMode) {
        const updateEmailBlastData: UpdateEmailBlastForm = {
          message,
          recipientFilter: recipients,
          ...(scheduledFor ? { scheduledFor } : {}),
        };

        await updateEmailBlastMutation.mutateAsync(updateEmailBlastData);
        toast.success(t('emailBlast.compose.toasts.updated'));
      } else {
        const emailBlastData: CreateEmailBlastForm = {
          message,
          recipientFilter: recipients,
          ...(scheduledFor && { scheduledFor }),
        };

        await createEmailBlastMutation.mutateAsync(emailBlastData);

        if (scheduled) {
          toast.success(t('emailBlast.compose.toasts.scheduled'));
        } else {
          toast.success(t('emailBlast.compose.toasts.sent'));
        }
      }

      onSend({
        recipients: selectedOption?.label || '',
        subject: subject.trim(),
        message,
      });
    } catch (error) {
      logger.error(isEditMode ? 'Failed to update email blast' : 'Failed to send email blast', {
        error,
      });
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message || '')
          : isEditMode
            ? t('emailBlast.compose.toasts.updateFailed')
            : t('emailBlast.compose.toasts.sendFailed');
      toast.error(errorMessage);

      if (isEmailBlastScheduledMutationRaceError(error)) {
        onStaleScheduledMutationAttempt?.();
      }
    }
  };

  const isValid = subject.trim() && editorContent.length > 0;
  const isLoading = createEmailBlastMutation.isPending || updateEmailBlastMutation.isPending;
  const canContinueFromTiming = isEditMode
    ? !!scheduledDate && !!scheduledTime
    : !scheduled || (!!scheduledDate && !!scheduledTime);
  const plainTextMessage = editor?.getText().trim() || '';
  const finalActionLabel = isEditMode
    ? t('emailBlast.compose.actions.saveChanges')
    : scheduled
      ? t('emailBlast.compose.actions.schedule')
      : t('emailBlast.compose.actions.send');
  const scheduleSummary =
    scheduled || isEditMode
      ? scheduledDate && scheduledTime
        ? t('emailBlast.compose.summary.scheduledFor', {
            date: new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString(intlLocale),
          })
        : t('emailBlast.compose.summary.scheduledPending')
      : t('emailBlast.compose.summary.asap');

  const isPreviewStep = step === 'preview';
  const primaryActionLabel = isPreviewStep ? finalActionLabel : tCommon('actions.next');
  const primaryActionDisabled =
    step === 'details'
      ? !isValid
      : step === 'timing'
        ? !canContinueFromTiming
        : isLoading || !isValid;

  const handlePrimaryAction = () => {
    if (step === 'details') {
      setStep('timing');
      return;
    }

    if (step === 'timing') {
      setStep('preview');
      return;
    }

    handleSend();
  };

  const handleSecondaryAction = () => {
    if (step === 'details') {
      onCancel();
      return;
    }

    if (step === 'timing') {
      setStep('details');
      return;
    }

    setStep('timing');
  };

  const secondaryActionLabel =
    step === 'details' ? tCommon('actions.cancel') : tCommon('actions.back');

  return (
    <div className='EmailBlastCompose-form'>
      <div className='EmailBlastCompose-stepContent'>
        {step === 'details' && (
          <div key='details' className='EmailBlastCompose-step'>
            <div className='EmailBlastCompose-field'>
              <label className='EmailBlastCompose-label'>
                <Users className='mr-2 inline h-4 w-4' />
                {t('emailBlast.compose.recipientsLabel')}
              </label>
              <select
                value={recipients}
                onChange={(e) => setRecipients(e.target.value as EmailBlastRecipientFilter)}
                className='EmailBlastCompose-select'
              >
                {recipientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} {!isLoadingRSVPs && `(${option.count})`}
                  </option>
                ))}
              </select>
              {selectedOption && (
                <div className='EmailBlastCompose-recipientOption'>
                  <div className='EmailBlastCompose-recipientInfo'>
                    <div className='EmailBlastCompose-recipientDescription'>
                      {selectedOption.description(selectedOption.count)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='EmailBlastCompose-field'>
              <label className='EmailBlastCompose-label'>
                <Mail className='mr-2 inline h-4 w-4' />
                {t('emailBlast.compose.subjectLabel')}
              </label>
              <input
                type='text'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('emailBlast.compose.subjectPlaceholder')}
                className='EmailBlastCompose-input dark:placeholder:text-neutral-500'
              />
            </div>

            <div className='EmailBlastCompose-field'>
              <label className='EmailBlastCompose-label' htmlFor='message'>
                {t('emailBlast.compose.messageLabel')}
              </label>

              {editor && (
                <div className='flex items-center gap-2 rounded-t-lg border border-gray-200 bg-gray-50 p-2 dark:border-neutral-800 dark:bg-neutral-950'>
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`rounded p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700 ${
                      editor.isActive('bold') ? 'bg-gray-200 dark:bg-neutral-700' : ''
                    }`}
                    type='button'
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`rounded p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700 ${
                      editor.isActive('italic') ? 'bg-gray-200 dark:bg-neutral-700' : ''
                    }`}
                    type='button'
                  >
                    <em>I</em>
                  </button>
                  <div className='mx-1 h-6 w-px bg-gray-300 dark:bg-neutral-600' />
                  <button
                    onClick={() => {
                      const url = window.prompt(t('emailBlast.compose.enterUrl'));
                      if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }}
                    className={`rounded p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700 ${
                      editor.isActive('link') ? 'bg-gray-200 dark:bg-neutral-700' : ''
                    }`}
                    type='button'
                  >
                    🔗
                  </button>
                </div>
              )}

              <div className='EmailBlastCompose-editor border-t-0'>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        )}

        {step === 'timing' && (
          <div key='timing' className='EmailBlastCompose-step'>
            <div className='EmailBlastCompose-field'>
              <label className='EmailBlastCompose-label'>
                {t('emailBlast.compose.deliveryLabel')}
              </label>
              {isEditMode ? (
                <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'>
                  {t('emailBlast.compose.rescheduleOnly')}
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setScheduled(false);
                      setScheduledDate('');
                      setScheduledTime('');
                    }}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      !scheduled
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-950'
                    }`}
                  >
                    <div className='font-medium'>{t('emailBlast.compose.now')}</div>
                    <div className='text-xs text-gray-500 dark:text-neutral-400'>
                      {t('emailBlast.sendAsap')}
                    </div>
                  </button>
                  <button
                    type='button'
                    onClick={() => setScheduled(true)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      scheduled
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-950'
                    }`}
                  >
                    <div className='font-medium'>{t('emailBlast.compose.later')}</div>
                    <div className='text-xs text-gray-500 dark:text-neutral-400'>
                      {t('emailBlast.compose.pickDateTime')}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {(scheduled || isEditMode) && (
              <div className='EmailBlastCompose-field'>
                <div className='mt-1 flex flex-col gap-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium' htmlFor='schedule-date'>
                      <Clock className='mr-2 inline h-4 w-4' />
                      {t('emailBlast.compose.date')}
                    </label>
                    <button
                      type='button'
                      onClick={() => setIsDatePickerOpen(true)}
                      className='EmailBlastCompose-input flex w-full items-center justify-between text-left'
                    >
                      {scheduledDate ? formattedDate : t('emailBlast.compose.selectDate')}
                      <CalendarClock className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
                    </button>
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium' htmlFor='schedule-time'>
                      <Clock className='mr-2 inline h-4 w-4' />
                      {t('emailBlast.compose.time')}
                    </label>
                    <button
                      type='button'
                      onClick={() => setIsTimePickerOpen(true)}
                      className='EmailBlastCompose-input flex w-full items-center justify-between text-left'
                    >
                      {scheduledTime
                        ? `${getTimeComponents().hour}:${getTimeComponents()
                            .minute.toString()
                            .padStart(2, '0')} ${getTimeComponents().period}`
                        : t('emailBlast.compose.selectTime')}
                      <Clock className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div key='preview' className='EmailBlastCompose-step'>
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40'>
              <div className='space-y-1 text-sm text-blue-800 dark:text-blue-400'>
                <p>
                  <strong>{t('emailBlast.compose.preview.recipients')}</strong>{' '}
                  {t('emailBlast.compose.preview.recipientsValue', {
                    label: selectedOption?.label ?? '',
                    count: selectedOption?.count ?? 0,
                  })}
                </p>
                <p className='pt-1 text-blue-700 dark:text-blue-400'>
                  <strong>{t('emailBlast.compose.preview.delivery')}</strong> {scheduleSummary}
                </p>
              </div>
            </div>

            <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900'>
              <div className='mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400'>
                <span>{t('emailBlast.compose.preview.inboxPreview')}</span>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
              </div>
              <div className='mb-2 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t('emailBlast.compose.preview.from')}
              </div>
              <div className='mb-1 text-sm text-gray-900 dark:text-neutral-100'>
                {t('emailBlast.compose.preview.subject', {
                  subject: subject || t('emailBlast.noSubject'),
                })}
              </div>
              <div className='text-sm text-gray-600 dark:text-neutral-400'>
                {plainTextMessage || t('emailBlast.compose.preview.noContent')}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='EmailBlastCompose-stickyFooter'>
        <div className='flex flex-col gap-3'>
          <Button
            onClick={handlePrimaryAction}
            disabled={primaryActionDisabled}
            type='button'
            className='h-14 w-full rounded-full bg-red-600 text-base font-semibold text-white hover:bg-red-700'
          >
            {isPreviewStep && isLoading ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                {isEditMode
                  ? t('emailBlast.compose.actions.updating')
                  : scheduled
                    ? t('emailBlast.compose.actions.scheduling')
                    : t('emailBlast.compose.actions.sending')}
              </>
            ) : (
              <>
                {primaryActionLabel}
                {isPreviewStep ? (
                  <Send className='ml-2 h-5 w-5' />
                ) : (
                  <ArrowRight className='ml-2 h-5 w-5' />
                )}
              </>
            )}
          </Button>
          <Button
            variant='outline'
            onClick={handleSecondaryAction}
            type='button'
            className='h-14 w-full rounded-full border-gray-300 text-base font-semibold dark:border-neutral-700'
          >
            {secondaryActionLabel}
          </Button>
        </div>
      </div>

      {/* Date Picker Modal */}
      <DatePickerSheet
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
        selectedDate={scheduledDate ? new Date(scheduledDate) : undefined}
        title={t('emailBlast.compose.scheduleDate')}
      />

      {/* Time Picker Modal */}
      <TimePickerSheet
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onTimeSelect={handleTimeSelect}
        selectedTime={getTimeComponents()}
        title={t('emailBlast.compose.scheduleTime')}
        onTimezoneSelect={function (timezone: string): void {
          setTimezone(timezone);
        }}
        timezone={timezone}
      />
    </div>
  );
}
