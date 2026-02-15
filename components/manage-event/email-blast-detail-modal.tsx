'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { EmailBlast } from '@/lib/types/api';
import DOMPurify from 'dompurify';
import { AlertCircle, CheckCircle, Users, XCircle } from 'lucide-react';

interface EmailBlastDetailModalProps {
  blast: EmailBlast;
  isOpen: boolean;
  onClose: () => void;
  onEditRequested?: (blast: EmailBlast) => void;
  onCancelRequested?: (blast: EmailBlast) => void;
  isCancelling?: boolean;
}

export default function EmailBlastDetailModal({
  blast,
  isOpen,
  onClose,
  onEditRequested,
  onCancelRequested,
  isCancelling = false,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'sending':
        return 'text-yellow-600 bg-yellow-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-700 bg-gray-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const deliveryRate =
    (blast.recipientCount ?? 0) > 0
      ? Math.round(((blast.delivered ?? 0) / (blast.recipientCount ?? 0)) * 100)
      : 0;

  const statusLabel = blast.status.charAt(0).toUpperCase() + blast.status.slice(1);
  const scheduleLabel =
    blast.status === 'scheduled' && blast.scheduled_for
      ? formatDate(blast.scheduled_for)
      : 'Send as soon as possible';
  const canEditOrCancel = blast.status === 'scheduled';
  const isSendingInProgress = blast.status === 'sending';

  return (
    <MasterScrollableSheet
      title='Email Blast Details'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='p-6'
      footer={
        canEditOrCancel ? (
          <div className='grid grid-cols-2 gap-3 border-t border-gray-100 bg-white p-4'>
            <Button type='button' variant='outline' onClick={() => onEditRequested?.(blast)}>
              Edit
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => onCancelRequested?.(blast)}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          </div>
        ) : isSendingInProgress ? (
          <div className='border-t border-gray-100 bg-white p-4 text-center text-sm text-gray-600'>
            Sending in progress
          </div>
        ) : undefined
      }
    >
      {/* Status and Basic Info */}
      <div className='mb-6'>
        <div className='mb-4'>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(blast.status)}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white'>
          <div className='border-b border-gray-100 px-4 py-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>Title</p>
            <p className='mt-1 text-base font-semibold text-gray-900'>
              {blast.subject || 'No subject'}
            </p>
          </div>
          <div className='border-b border-gray-100 px-4 py-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>
              Scheduled For Sending
            </p>
            <p className='mt-1 text-base font-semibold text-gray-900'>{scheduleLabel}</p>
          </div>
          <div className='border-b border-gray-100 px-4 py-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>Created</p>
            <p className='mt-1 text-base font-semibold text-gray-900'>
              {formatDate(blast.created_at)}
            </p>
          </div>
          <div className='px-4 py-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>ID</p>
            <p className='mt-1 break-all text-base font-semibold text-gray-900'>{blast.id}</p>
          </div>
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
            <strong>Target:</strong> {blast.recipients || 'All Recipients'}
          </p>
          <p className='text-sm text-gray-700'>
            <strong>Total Recipients:</strong> {blast.recipientCount ?? 0}
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
            <p className='text-2xl font-bold text-green-600'>{blast.delivered ?? 0}</p>
          </div>

          {(blast.failed ?? 0) > 0 && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <XCircle className='h-4 w-4 text-red-600' />
                <span className='text-sm font-medium text-red-900'>Failed</span>
              </div>
              <p className='text-2xl font-bold text-red-600'>{blast.failed ?? 0}</p>
            </div>
          )}

          {(blast.pending ?? 0) > 0 && (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
              <div className='mb-1 flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-yellow-600' />
                <span className='text-sm font-medium text-yellow-900'>Pending</span>
              </div>
              <p className='text-2xl font-bold text-yellow-600'>{blast.pending ?? 0}</p>
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blast.message) }}
          />
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
