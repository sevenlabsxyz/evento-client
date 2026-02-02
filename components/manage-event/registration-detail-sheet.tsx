'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useRegistrationSubmissionDetail } from '@/lib/hooks/use-registration-submission-detail';
import type { RegistrationStatus } from '@/lib/types/api';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

interface RegistrationDetailSheetProps {
  eventId: string;
  registrationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (registrationId: string) => Promise<void>;
  onDeny: (registrationId: string, reason?: string) => Promise<void>;
  isApproving: boolean;
  isDenying: boolean;
}

export function RegistrationDetailSheet({
  eventId,
  registrationId,
  isOpen,
  onClose,
  onApprove,
  onDeny,
  isApproving,
  isDenying,
}: RegistrationDetailSheetProps) {
  const [showDenyInput, setShowDenyInput] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const { data: submission, isLoading } = useRegistrationSubmissionDetail(eventId, registrationId);

  const handleApprove = async () => {
    if (!registrationId) return;
    await onApprove(registrationId);
    onClose();
  };

  const handleStartDeny = () => {
    setShowDenyInput(true);
  };

  const handleConfirmDeny = async () => {
    if (!registrationId) return;
    await onDeny(registrationId, denyReason || undefined);
    setShowDenyInput(false);
    setDenyReason('');
    onClose();
  };

  const handleCancelDeny = () => {
    setShowDenyInput(false);
    setDenyReason('');
  };

  const handleClose = () => {
    setShowDenyInput(false);
    setDenyReason('');
    onClose();
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    const styles: Record<RegistrationStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
    };

    const labels: Record<RegistrationStatus, string> = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied',
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const isPending = submission?.approval_status === 'pending';

  const footer = isPending ? (
    <div className='space-y-3'>
      {showDenyInput ? (
        <>
          <input
            type='text'
            placeholder='Reason for denial (optional)'
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400'
          />
          <div className='flex gap-2'>
            <Button
              onClick={handleConfirmDeny}
              disabled={isDenying}
              className='flex-1 bg-red-500 text-white hover:bg-red-600'
            >
              Confirm Deny
            </Button>
            <Button
              onClick={handleCancelDeny}
              disabled={isDenying}
              variant='outline'
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className='flex gap-2'>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className='flex-1 bg-green-500 text-white hover:bg-green-600'
          >
            <Check className='mr-2 h-4 w-4' />
            Approve
          </Button>
          <Button
            onClick={handleStartDeny}
            className='flex-1 bg-red-500 text-white hover:bg-red-600'
          >
            <X className='mr-2 h-4 w-4' />
            Deny
          </Button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <MasterScrollableSheet
      title='Registration Details'
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      footer={footer}
    >
      <div className='px-4 pb-4'>
        {isLoading ? (
          <div className='space-y-4'>
            <div className='flex items-start gap-4'>
              <Skeleton className='h-14 w-14 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-40' />
              </div>
            </div>
            <div className='space-y-4 pt-4'>
              <Skeleton className='h-4 w-24' />
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='space-y-1'>
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-5 w-full' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : submission ? (
          <div className='space-y-6'>
            {/* User Info Section */}
            <div className='flex items-start gap-4'>
              <UserAvatar
                user={{
                  name: submission.user_details?.name || submission.name,
                  username: submission.user_details?.username,
                  image: submission.user_details?.image,
                  verification_status: submission.user_details?.verification_status,
                }}
                height={56}
                width={56}
              />
              <div className='flex-1'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {submission.user_details?.name || submission.name}
                    </h3>
                    {submission.user_details?.username && (
                      <p className='text-sm text-gray-500'>@{submission.user_details.username}</p>
                    )}
                    <p className='text-sm text-gray-500'>{submission.email}</p>
                  </div>
                  {getStatusBadge(submission.approval_status)}
                </div>
                <div className='mt-2 space-y-1'>
                  <p className='text-xs text-gray-400'>
                    Submitted {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                  {submission.reviewed_at && (
                    <p className='text-xs text-gray-400'>
                      Reviewed {format(new Date(submission.reviewed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Denial Reason (if denied) */}
            {submission.approval_status === 'denied' && submission.denial_reason && (
              <div className='rounded-xl bg-red-50 p-4'>
                <p className='text-sm font-medium text-red-800'>Denial Reason</p>
                <p className='mt-1 text-sm text-red-700'>{submission.denial_reason}</p>
              </div>
            )}

            {/* Answers Section */}
            {submission.answers && submission.answers.length > 0 && (
              <div className='border-t border-gray-100 pt-4'>
                <h4 className='mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  Registration Answers
                </h4>
                <div className='space-y-4'>
                  {submission.answers.map((answer) => (
                    <div key={answer.question_id} className='rounded-xl bg-gray-50 p-4'>
                      <p className='text-sm font-medium text-gray-600'>{answer.question_label}</p>
                      <p className='mt-1 text-gray-900'>
                        {answer.answer || <span className='italic text-gray-400'>No answer</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No answers message */}
            {(!submission.answers || submission.answers.length === 0) && (
              <div className='border-t border-gray-100 pt-4'>
                <p className='text-center text-sm text-gray-400'>
                  No registration questions were configured for this event.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <p className='text-gray-500'>Registration not found</p>
          </div>
        )}
      </div>
    </MasterScrollableSheet>
  );
}
