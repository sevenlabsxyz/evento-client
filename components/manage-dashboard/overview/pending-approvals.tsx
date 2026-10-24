'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import { queryKeys } from '@/lib/query-client';
import type { RegistrationSubmission } from '@/lib/types/api';
import { getRelativeTime } from '@/lib/utils/date';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

interface PendingApprovalsProps {
  eventId: string;
  pendingCount: number;
}

export function PendingApprovals({ eventId, pendingCount }: PendingApprovalsProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useRegistrationSubmissions(eventId, {
    status: 'pending',
    limit: 5,
  });
  const approveRegistration = useApproveRegistration();
  const denyRegistration = useDenyRegistration();
  const submissionsHref = `/e/${eventId}/manage/registration/submissions`;

  const busyId =
    (approveRegistration.isPending && approveRegistration.variables?.registrationId) ||
    (denyRegistration.isPending && denyRegistration.variables?.registrationId) ||
    null;

  const handleReview = async (submission: RegistrationSubmission, action: 'approve' | 'deny') => {
    const variables = { eventId, registrationId: submission.id };
    try {
      if (action === 'approve') {
        await approveRegistration.mutateAsync(variables);
        toast.success(`Approved ${submission.name}`);
      } else {
        await denyRegistration.mutateAsync(variables);
        toast.success(`Denied ${submission.name}`);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
    } catch (reviewError) {
      logger.error(`Failed to ${action} registration`, {
        eventId,
        registrationId: submission.id,
        error: reviewError,
      });
      toast.error(getErrorMessage(reviewError) || `Failed to ${action} registration`);
    }
  };

  const submissions = data?.registrations ?? [];

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
          Pending approvals
          <span className='ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'>
            {pendingCount}
          </span>
        </h2>
        <Link
          href={submissionsHref}
          className='flex items-center gap-0.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100'
        >
          View all
          <ChevronRight className='h-4 w-4' />
        </Link>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='flex items-center gap-3'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-8 w-20 rounded-lg' />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className='text-sm text-red-600 dark:text-red-400'>
          Couldn&apos;t load pending registrations.
        </p>
      ) : submissions.length === 0 ? (
        <p className='text-sm text-gray-500 dark:text-neutral-400'>No pending registrations.</p>
      ) : (
        <ul className='divide-y divide-gray-100 dark:divide-neutral-800'>
          {submissions.map((submission) => {
            const isBusy = busyId === submission.id;
            return (
              <li key={submission.id} className='flex items-center gap-3 py-2.5'>
                <UserAvatar
                  size='sm'
                  user={{
                    name: submission.user_details?.name || submission.name,
                    username: submission.user_details?.username,
                    image: submission.user_details?.image,
                    verification_status: submission.user_details?.verification_status,
                  }}
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
                    {submission.user_details?.name || submission.name}
                  </p>
                  <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {submission.email} · {getRelativeTime(submission.created_at)}
                  </p>
                </div>
                <div className='flex shrink-0 gap-1.5'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 w-8 p-0 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                    disabled={busyId !== null}
                    onClick={() => handleReview(submission, 'deny')}
                    aria-label={`Deny ${submission.name}`}
                  >
                    <X className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </Button>
                  <Button
                    size='sm'
                    className='h-8 gap-1 px-3'
                    disabled={busyId !== null}
                    onClick={() => handleReview(submission, 'approve')}
                  >
                    <Check className='h-4 w-4' />
                    {isBusy && approveRegistration.isPending ? 'Approving…' : 'Approve'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
