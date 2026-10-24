'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { EmailBlast } from '@/lib/types/api';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import { AlertCircle, CheckCircle, Users, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  // Sanitized after mount: DOMPurify can't run during SSR (no window), so raw
  // HTML must never reach dangerouslySetInnerHTML on the server. Empty until
  // the effect below replaces it with the sanitized value.
  const [cleanMessage, setCleanMessage] = useState('');

  useEffect(() => {
    setCleanMessage(sanitizeRichText(blast.message));
  }, [blast.message]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getIntlLocale(locale), {
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
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/60';
      case 'pending':
      case 'sending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/60';
      case 'scheduled':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60';
      case 'cancelled':
        return 'text-gray-700 dark:text-neutral-300 bg-gray-200 dark:bg-neutral-700';
      default:
        return 'text-gray-600 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-800';
    }
  };

  const deliveryRate =
    (blast.recipientCount ?? 0) > 0
      ? Math.round(((blast.delivered ?? 0) / (blast.recipientCount ?? 0)) * 100)
      : 0;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return t('emailBlast.status.scheduled');
      case 'sending':
        return t('emailBlast.status.sending');
      case 'completed':
        return t('emailBlast.status.completed');
      case 'failed':
        return t('emailBlast.status.failed');
      case 'cancelled':
        return t('emailBlast.status.cancelled');
      case 'draft':
        return t('emailBlast.status.draft');
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const statusLabel = getStatusLabel(blast.status);
  const scheduleLabel =
    blast.status === 'scheduled' && blast.scheduled_for
      ? formatDate(blast.scheduled_for)
      : t('emailBlast.sendAsap');
  const canEditOrCancel = blast.status === 'scheduled';
  const isSendingInProgress = blast.status === 'sending';

  return (
    <MasterScrollableSheet
      title={t('emailBlast.detail.title')}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='p-6'
      footer={
        canEditOrCancel ? (
          <div className='grid grid-cols-2 gap-3 border-t border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
            <Button type='button' variant='outline' onClick={() => onEditRequested?.(blast)}>
              {tCommon('actions.edit')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => onCancelRequested?.(blast)}
              disabled={isCancelling}
            >
              {isCancelling ? t('emailBlast.cancelling') : tCommon('actions.cancel')}
            </Button>
          </div>
        ) : isSendingInProgress ? (
          <div className='border-t border-gray-100 bg-white p-4 text-center text-sm text-gray-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'>
            {t('emailBlast.detail.sendingInProgress')}
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

        <div className='rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='border-b border-gray-100 px-4 py-3 dark:border-neutral-800'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              {t('emailBlast.detail.titleLabel')}
            </p>
            <p className='mt-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {blast.subject || t('emailBlast.noSubject')}
            </p>
          </div>
          <div className='border-b border-gray-100 px-4 py-3 dark:border-neutral-800'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              {t('emailBlast.detail.scheduledForSending')}
            </p>
            <p className='mt-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {scheduleLabel}
            </p>
          </div>
          <div className='border-b border-gray-100 px-4 py-3 dark:border-neutral-800'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              {t('emailBlast.detail.created')}
            </p>
            <p className='mt-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {formatDate(blast.created_at)}
            </p>
          </div>
          <div className='px-4 py-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              {t('emailBlast.detail.id')}
            </p>
            <p className='mt-1 break-all text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {blast.id}
            </p>
          </div>
        </div>
      </div>

      {/* Recipients Info */}
      <div className='mb-6'>
        <h4 className='mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-neutral-100'>
          <Users className='h-4 w-4' />
          {t('emailBlast.detail.recipients')}
        </h4>
        <div className='rounded-lg bg-gray-50 p-4 dark:bg-neutral-950'>
          <p className='mb-2 text-sm text-gray-700 dark:text-neutral-300'>
            <strong>{t('emailBlast.detail.target')}</strong>{' '}
            {blast.recipients || t('emailBlast.detail.allRecipients')}
          </p>
          <p className='text-sm text-gray-700 dark:text-neutral-300'>
            <strong>{t('emailBlast.detail.totalRecipients')}</strong> {blast.recipientCount ?? 0}
          </p>
        </div>
      </div>

      {/* Delivery Statistics */}
      <div className='mb-6'>
        <h4 className='mb-3 font-semibold text-gray-900 dark:text-neutral-100'>
          {t('emailBlast.detail.deliveryStatistics')}
        </h4>
        <div className='mb-4 grid grid-cols-2 gap-4'>
          <div className='rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40'>
            <div className='mb-1 flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
              <span className='text-sm font-medium text-green-900 dark:text-green-400'>
                {t('emailBlast.status.delivered')}
              </span>
            </div>
            <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {blast.delivered ?? 0}
            </p>
          </div>

          {(blast.failed ?? 0) > 0 && (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40'>
              <div className='mb-1 flex items-center gap-2'>
                <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                <span className='text-sm font-medium text-red-900 dark:text-red-400'>
                  {t('emailBlast.status.failed')}
                </span>
              </div>
              <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                {blast.failed ?? 0}
              </p>
            </div>
          )}

          {(blast.pending ?? 0) > 0 && (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/40'>
              <div className='mb-1 flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
                <span className='text-sm font-medium text-yellow-900 dark:text-yellow-400'>
                  {t('emailBlast.status.pending')}
                </span>
              </div>
              <p className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
                {blast.pending ?? 0}
              </p>
            </div>
          )}
        </div>

        <div className='rounded-lg bg-gray-50 p-4 dark:bg-neutral-950'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
              {t('emailBlast.detail.deliveryRate')}
            </span>
            <span className='text-sm font-bold text-gray-900 dark:text-neutral-100'>
              {deliveryRate}%
            </span>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-neutral-700'>
            <div
              className='h-2 rounded-full bg-green-500 transition-all duration-300'
              style={{ width: `${deliveryRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className='mb-6'>
        <h4 className='mb-3 font-semibold text-gray-900 dark:text-neutral-100'>
          {t('emailBlast.detail.message')}
        </h4>
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
          <div
            className='prose prose-sm max-w-none text-gray-700 dark:text-neutral-300'
            dangerouslySetInnerHTML={{ __html: cleanMessage }}
          />
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
