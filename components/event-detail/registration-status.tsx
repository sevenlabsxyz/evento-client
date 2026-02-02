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
      icon: <Clock className='h-6 w-6 text-yellow-500' />,
      title: 'Registration Pending',
      description: 'Your registration is awaiting approval from the host.',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    approved: {
      icon: <CheckCircle className='h-6 w-6 text-green-500' />,
      title: "You're Registered!",
      description: 'Your registration has been approved.',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    denied: {
      icon: <XCircle className='h-6 w-6 text-red-500' />,
      title: 'Registration Not Approved',
      description: registration.denial_reason
        ? `Reason: ${registration.denial_reason}`
        : 'Unfortunately, your registration was not approved.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[registration.approval_status];
  const submittedAt = formatDistanceToNow(new Date(registration.created_at), { addSuffix: true });

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-6`}>
      <div className='flex items-start gap-4'>
        <div className='flex-shrink-0'>{config.icon}</div>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-gray-900'>{config.title}</h3>
          <p className='mt-1 text-sm text-gray-600'>{config.description}</p>
          <p className='mt-2 text-xs text-gray-500'>Registered {submittedAt}</p>

          {registration.approval_status === 'approved' && registration.reviewed_at && (
            <p className='mt-1 text-xs text-gray-500'>
              Approved{' '}
              {formatDistanceToNow(new Date(registration.reviewed_at), { addSuffix: true })}
            </p>
          )}

          {registration.approval_status === 'approved' && onShowRsvp && (
            <button
              onClick={onShowRsvp}
              className='mt-4 w-full rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600'
            >
              Update RSVP
            </button>
          )}

          {registration.approval_status === 'denied' && (
            <p className='mt-4 text-xs text-gray-500'>
              If you believe this was a mistake, please contact the event host.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
