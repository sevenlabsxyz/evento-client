'use client';

import { useCreateEmailBlastWithCallbacks } from '@/lib/hooks/useEmailBlasts';
import { getRecipientCount, useRSVPStats } from '@/lib/hooks/useRSVPStats';
import {
  CreateEmailBlastForm,
  EmailBlastRecipientFilter,
} from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CalendarClock, Clock, Loader2, Mail, Send, Users } from 'lucide-react';
import { useState } from 'react';
import DatePickerModal from '../shared/date-picker-modal';
import TimePickerModal from '../shared/time-picker-modal';

interface EmailBlastComposeProps {
  eventId: string;
  onSend: (data: {
    recipients: string;
    subject: string;
    message: string;
  }) => void;
  onCancel: () => void;
}

export default function EmailBlastCompose({
  eventId,
  onSend,
  onCancel,
}: EmailBlastComposeProps) {
  const [recipients, setRecipients] =
    useState<EmailBlastRecipientFilter>('all');
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // State for date/time picker modals
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Format the scheduled date for display
  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString('en-US', {
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
  const handleTimeSelect = (time: {
    hour: number;
    minute: number;
    period: 'AM' | 'PM';
  }) => {
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
  const { data: rsvpStats, isLoading: isLoadingStats } = useRSVPStats(eventId);

  // Dynamic recipient options based on RSVP stats
  const recipientOptions = [
    {
      value: 'all' as const,
      label: 'All RSVPs',
      description: (count: number) =>
        `Send to all ${!isLoadingStats ? count : ''} guest${
          count === 1 ? '' : 's'
        } who have RSVPd`,
      count: getRecipientCount(rsvpStats, 'all'),
    },
    {
      value: 'rsvp-yes' as const,
      label: 'RSVP: Yes',
      description: (count: number) =>
        `Send to ${!isLoadingStats ? count : ''} guest${
          count === 1 ? '' : 's'
        } who confirmed attendance`,
      count: getRecipientCount(rsvpStats, 'rsvp-yes'),
    },
    {
      value: 'rsvp-maybe' as const,
      label: 'RSVP: Maybe',
      description: (count: number) =>
        `Send to ${!isLoadingStats ? count : ''} guest${
          count === 1 ? '' : 's'
        } who might attend`,
      count: getRecipientCount(rsvpStats, 'rsvp-maybe'),
    },
    {
      value: 'rsvp-no' as const,
      label: 'RSVP: No',
      description: (count: number) =>
        `Send to ${!isLoadingStats ? count : ''} guest${
          count === 1 ? '' : 's'
        } who declined`,
      count: getRecipientCount(rsvpStats, 'rsvp-no'),
    },
    {
      value: 'invited' as const,
      label: 'All Invited',
      description: (count: number) =>
        `Send to all ${!isLoadingStats ? count : ''} invited guest${
          count === 1 ? '' : 's'
        }`,
      count: getRecipientCount(rsvpStats, 'invited'),
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
          class: 'text-red-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your email here...',
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

  const selectedOption = recipientOptions.find(
    (option) => option.value === recipients
  );

  const handleSend = async () => {
    if (!editor || !subject.trim()) return;

    const message = editor.getHTML();

    try {
      // Calculate scheduled_for date if scheduling is enabled
      let scheduledFor: string | null = null;

      if (scheduled && scheduledDate && scheduledTime) {
        try {
          // Combine date and time into ISO string
          scheduledFor = new Date(
            `${scheduledDate}T${scheduledTime}`
          ).toISOString();
        } catch (e) {
          toast.error('Invalid date or time format');
          return;
        }
      }

      const emailBlastData: CreateEmailBlastForm = {
        message,
        recipientFilter: recipients,
        ...(scheduledFor && { scheduledFor }),
      };

      await createEmailBlastMutation.mutateAsync(emailBlastData);

      // Show success toast
      if (scheduled) {
        toast.success('Email blast scheduled successfully!');
      } else {
        toast.success('Email blast sent successfully!');
      }

      // Call the original onSend for UI feedback
      onSend({
        recipients: selectedOption?.label || '',
        subject: subject.trim(),
        message,
      });
    } catch (error) {
      console.error('Failed to send email blast:', error);
      // Show error toast with specific message
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send email blast';
      toast.error(errorMessage);
    }
  };

  const isValid = subject.trim() && editorContent.length > 0;
  const isLoading = createEmailBlastMutation.isPending;

  return (
    <div className="EmailBlastCompose-form">
      {/* Recipients Field */}
      <div className="EmailBlastCompose-field">
        <label className="EmailBlastCompose-label">
          <Users className="w-4 h-4 inline mr-2" />
          Recipients
        </label>
        <select
          value={recipients}
          onChange={(e) =>
            setRecipients(e.target.value as EmailBlastRecipientFilter)
          }
          className="EmailBlastCompose-select"
        >
          {recipientOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} {!isLoadingStats && `(${option.count})`}
            </option>
          ))}
        </select>
        {selectedOption && (
          <div className="EmailBlastCompose-recipientOption">
            <div className="EmailBlastCompose-recipientInfo">
              <div className="EmailBlastCompose-recipientDescription">
                {selectedOption.description(selectedOption.count)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject Field */}
      <div className="EmailBlastCompose-field">
        <label className="EmailBlastCompose-label">
          <Mail className="w-4 h-4 inline mr-2" />
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject..."
          className="EmailBlastCompose-input"
        />
      </div>

      {/* Message Field */}
      <div className="EmailBlastCompose-field">
        <label className="EmailBlastCompose-label" htmlFor="message">
          Message
        </label>

        {/* Simple Toolbar */}
        {editor && (
          <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-t-lg bg-gray-50">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              type="button"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              type="button"
            >
              <em>I</em>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('link') ? 'bg-gray-200' : ''
              }`}
              type="button"
            >
              🔗
            </button>
          </div>
        )}

        <div className="EmailBlastCompose-editor border-t-0">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Scheduling Options */}
      <div className="EmailBlastCompose-field">
        <div className="flex items-center">
          <label className="EmailBlastCompose-label flex items-center">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
            />
            <CalendarClock className="w-4 h-4 inline mr-2" />
            Schedule for later
          </label>
        </div>

        {scheduled && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="schedule-date"
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="EmailBlastCompose-input flex items-center justify-between w-full text-left"
              >
                {scheduledDate ? formattedDate : 'Select date'}
                <CalendarClock className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1">
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="schedule-time"
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Time
              </label>
              <button
                type="button"
                onClick={() => setIsTimePickerOpen(true)}
                className="EmailBlastCompose-input flex items-center justify-between w-full text-left"
              >
                {scheduledTime
                  ? `${getTimeComponents().hour}:${getTimeComponents()
                      .minute.toString()
                      .padStart(2, '0')} ${getTimeComponents().period}`
                  : 'Select time'}
                <Clock className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Email Preview</h4>
        <div className="text-sm text-blue-800">
          <p>
            <strong>To:</strong> {selectedOption?.label} (
            {selectedOption?.count} recipients)
          </p>
          <p>
            <strong>Subject:</strong> {subject || 'No subject'}
          </p>
          <p>
            <strong>Message:</strong>{' '}
            {editor?.getText()
              ? `${editor.getText().slice(0, 100)}...`
              : 'No message'}
          </p>
          {scheduled && scheduledDate && scheduledTime && (
            <p className="mt-2 text-blue-700">
              <strong>Scheduled for:</strong>{' '}
              {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="EmailBlastCompose-actions">
        <button
          onClick={onCancel}
          className="EmailBlastCompose-button EmailBlastCompose-button--cancel"
          type="button"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!isValid || isLoading}
          className="EmailBlastCompose-button EmailBlastCompose-button--send"
          type="button"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {scheduled ? 'Scheduling...' : 'Sending...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {scheduled ? 'Schedule Email Blast' : 'Send Email Blast'}
            </>
          )}
        </button>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
        selectedDate={scheduledDate ? new Date(scheduledDate) : undefined}
        title="Schedule Date"
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onTimeSelect={handleTimeSelect}
        selectedTime={getTimeComponents()}
        title="Schedule Time"
      />
    </div>
  );
}
