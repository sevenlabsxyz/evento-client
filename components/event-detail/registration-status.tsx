'use client';

import type { UserRegistration } from '@/lib/types/api';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface RegistrationStatusProps {
  registration: UserRegistration;
  onShowRsvp?: () => void;
}

export function RegistrationStatus({ registration, onShowRsvp }: RegistrationStatusProps) {
  const t = useTranslations('event');
  const locale = useLocale();
  const dateFnsLocale = locale === 'pt-BR' ? ptBR : locale === 'es' ? es : enUS;

  const statusConfig = {
    pending: {
      icon: <Clock className='h-5 w-5 text-amber-600 dark:text-amber-400' />,
      title: t('registrationStatus.pendingTitle'),
      description: t('registrationStatus.pendingDescription'),
      tileColor: 'bg-amber-50 dark:bg-amber-950/40',
    },
    approved: {
      icon: <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />,
      title: t('registrationStatus.approvedTitle'),
      description: t('registrationStatus.approvedDescription'),
      tileColor: 'bg-green-50 dark:bg-green-950/40',
    },
    denied: {
      icon: <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />,
      title: t('registrationStatus.deniedTitle'),
      description: registration.denial_reason
        ? t('registrationStatus.deniedReason', { reason: registration.denial_reason })
        : t('registrationStatus.deniedDescription'),
      tileColor: 'bg-red-50 dark:bg-red-950/40',
    },
  };

  const config = statusConfig[registration.approval_status];
  const submittedAt = formatDistanceToNow(new Date(registration.created_at), {
    addSuffix: true,
    locale: dateFnsLocale,
  });

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-start gap-3'>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.tileColor}`}
        >
          {config.icon}
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {config.title}
          </h3>
          <p className='mt-0.5 text-sm text-gray-600 dark:text-neutral-400'>{config.description}</p>
          <p className='mt-2 text-xs text-gray-500 dark:text-neutral-500'>
            {t('registrationStatus.registeredAgo', { time: submittedAt })}
          </p>

          {registration.approval_status === 'approved' && registration.reviewed_at && (
            <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-500'>
              {t('registrationStatus.approvedAgo', {
                time: formatDistanceToNow(new Date(registration.reviewed_at), {
                  addSuffix: true,
                  locale: dateFnsLocale,
                }),
              })}
            </p>
          )}

          {registration.approval_status === 'approved' && onShowRsvp && (
            <button
              onClick={onShowRsvp}
              type='button'
              className='mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            >
              {t('registrationStatus.updateRsvp')}
            </button>
          )}

          {registration.approval_status === 'denied' && (
            <p className='mt-3 text-xs text-gray-500 dark:text-neutral-500'>
              {t('registrationStatus.contactHost')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
