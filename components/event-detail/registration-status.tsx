'use client';

import type { UserRegistration } from '@/lib/types/api';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface RegistrationStatusProps {
  registration: UserRegistration;
  onShowRsvp?: () => void;
}

export function RegistrationStatus({ registration, onShowRsvp }: RegistrationStatusProps) {
  const statusConfig = {
    pending: {
      icon: <Clock className='h-5 w-5 text-amber-600 dark:text-amber-400' />,
      title: 'Registration Pending',
      description: "You're on the list! We're waiting for the host to approve your registration.",
      tileColor: 'bg-amber-50 dark:bg-amber-950/40',
    },
    approved: {
      icon: <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />,
      title: "You're Registered!",
      description: 'Your registration has been approved.',
      tileColor: 'bg-green-50 dark:bg-green-950/40',
    },
    denied: {
      icon: <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />,
      title: 'Registration Not Approved',
      description: registration.denial_reason
        ? `Reason: ${registration.denial_reason}`
        : 'Unfortunately, your registration was not approved.',
      tileColor: 'bg-red-50 dark:bg-red-950/40',
    },
  };

  const config = statusConfig[registration.approval_status];
  const submittedAt = formatDistanceToNow(new Date(registration.created_at), { addSuffix: true });

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
            Registered {submittedAt}
          </p>

          {registration.approval_status === 'approved' && registration.reviewed_at && (
            <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-500'>
              Approved{' '}
              {formatDistanceToNow(new Date(registration.reviewed_at), { addSuffix: true })}
            </p>
          )}

          {registration.approval_status === 'approved' && onShowRsvp && (
            <button
              onClick={onShowRsvp}
              type='button'
              className='mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
            >
              Update RSVP
            </button>
          )}

          {registration.approval_status === 'denied' && (
            <p className='mt-3 text-xs text-gray-500 dark:text-neutral-500'>
              If you believe this was a mistake, please contact the event host.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
