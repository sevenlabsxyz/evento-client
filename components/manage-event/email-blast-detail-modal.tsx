'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { VisuallyHidden } from '@silk-hq/components';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  Clock,
  Copy,
  Mail,
  Users,
  X,
  XCircle,
} from 'lucide-react';

interface EmailBlast {
  id: string;
  subject: string;
  recipients: string;
  recipientCount: number;
  status: string;
  created_at: string;
  scheduled_for?: string | null;
  delivered: number;
  failed: number;
  pending: number;
  message: string;
}

interface EmailBlastDetailModalProps {
  blast: EmailBlast;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailBlastDetailModal({
  blast,
  isOpen,
  onClose,
}: EmailBlastDetailModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'pending':
      case 'sending':
        return <AlertCircle className='h-5 w-5 text-yellow-600' />;
      case 'scheduled':
        return <CalendarClock className='h-5 w-5 text-blue-600' />;
      case 'failed':
        return <XCircle className='h-5 w-5 text-red-600' />;
      default:
        return <Clock className='h-5 w-5 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'sending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(blast.id);
    // TODO: Show toast notification
  };

  const deliveryRate =
    blast.recipientCount > 0 ? Math.round((blast.delivered / blast.recipientCount) * 100) : 0;

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='relative flex h-full flex-col'>
            {/* Handle */}
            <div className='mb-4 flex justify-center p-6 pt-4'>
              <SheetWithDetentFull.Handle />
            </div>

            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-100 px-6 pb-4'>
              <div className='flex items-center gap-3'>
                <Mail className='h-6 w-6 text-red-500' />
                <h2 className='text-xl font-semibold text-gray-900'>Email Blast Details</h2>
              </div>
              <button
                onClick={onClose}
                className='rounded-full p-2 transition-colors hover:bg-gray-100'
              >
                <X className='h-5 w-5 text-gray-500' />
              </button>
            </div>

            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>Email Blast Details</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild className='flex-1 overflow-hidden'>
              <SheetWithDetentFull.ScrollView className='h-full flex-1'>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {/* Status and Basic Info */}
                  <div className='mb-6'>
                    <div className='mb-4 flex items-center gap-3'>
                      {getStatusIcon(blast.status)}
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(blast.status)}`}
                      >
                        {blast.status.charAt(0).toUpperCase() + blast.status.slice(1)}
                      </span>
                    </div>

                    <h3 className='mb-2 text-lg font-semibold text-gray-900'>{blast.subject}</h3>

                    {/* Display scheduling information if scheduled */}
                    {blast.status === 'scheduled' && blast.scheduled_for ? (
                      <div className='mb-2 flex items-center gap-2 text-blue-600'>
                        <CalendarClock className='h-4 w-4' />
                        <p className='text-sm font-medium'>
                          Scheduled to send at: {formatDate(blast.scheduled_for)}
                        </p>
                      </div>
                    ) : null}

                    <p className='mb-4 text-gray-600'>Created: {formatDate(blast.created_at)}</p>

                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <span>ID: {blast.id}</span>
                      <button
                        onClick={handleCopyId}
                        className='rounded p-1 transition-colors hover:bg-gray-100'
                        title='Copy ID'
                      >
                        <Copy className='h-3 w-3' />
                      </button>
                    </div>
                  </div>

                  {/* Recipients Info */}
                  <div className='mb-6'>
                    <h4 className='mb-3 flex items-center gap-2 font-semibold text-gray-900'>
                      <Users className='h-4 w-4' />
                      Recipients
                    </h4>
                    <div className='rounded-lg bg-gray-50 p-4'>
                      <p className='mb-2 text-sm text-gray-700'>
                        <strong>Target:</strong> {blast.recipients}
                      </p>
                      <p className='text-sm text-gray-700'>
                        <strong>Total Recipients:</strong> {blast.recipientCount}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Statistics */}
                  <div className='mb-6'>
                    <h4 className='mb-3 font-semibold text-gray-900'>Delivery Statistics</h4>
                    <div className='mb-4 grid grid-cols-2 gap-4'>
                      <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                        <div className='mb-1 flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-green-600' />
                          <span className='text-sm font-medium text-green-900'>Delivered</span>
                        </div>
                        <p className='text-2xl font-bold text-green-600'>{blast.delivered}</p>
                      </div>

                      {blast.failed > 0 && (
                        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                          <div className='mb-1 flex items-center gap-2'>
                            <XCircle className='h-4 w-4 text-red-600' />
                            <span className='text-sm font-medium text-red-900'>Failed</span>
                          </div>
                          <p className='text-2xl font-bold text-red-600'>{blast.failed}</p>
                        </div>
                      )}

                      {blast.pending > 0 && (
                        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                          <div className='mb-1 flex items-center gap-2'>
                            <AlertCircle className='h-4 w-4 text-yellow-600' />
                            <span className='text-sm font-medium text-yellow-900'>Pending</span>
                          </div>
                          <p className='text-2xl font-bold text-yellow-600'>{blast.pending}</p>
                        </div>
                      )}
                    </div>

                    <div className='rounded-lg bg-gray-50 p-4'>
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='text-sm font-medium text-gray-700'>Delivery Rate</span>
                        <span className='text-sm font-bold text-gray-900'>{deliveryRate}%</span>
                      </div>
                      <div className='h-2 w-full rounded-full bg-gray-200'>
                        <div
                          className='h-2 rounded-full bg-green-500 transition-all duration-300'
                          style={{ width: `${deliveryRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className='mb-6'>
                    <h4 className='mb-3 font-semibold text-gray-900'>Message</h4>
                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                      <div
                        className='prose prose-sm max-w-none text-gray-700'
                        dangerouslySetInnerHTML={{ __html: blast.message }}
                      />
                    </div>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
