'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import type { RegistrationStatus, RegistrationSubmission } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { ArrowLeft, Check, ClipboardList, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type TabStatus = RegistrationStatus | 'all';

export default function RegistrationSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');

  // Get existing event data from API
  const { data: existingEvent, isLoading: isLoadingEvent, error } = useEventDetails(eventId);

  // Get registration submissions
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useRegistrationSubmissions(
    eventId,
    { status: activeTab }
  );

  // Mutations
  const approveRegistration = useApproveRegistration();
  const denyRegistration = useDenyRegistration();

  const isLoading = isLoadingEvent || isLoadingSubmissions;

  const registrations = submissionsData?.registrations ?? [];
  const counts = submissionsData?.counts ?? { pending: 0, approved: 0, denied: 0 };

  // Filter registrations based on active tab (already filtered by API, but this handles 'all')
  const filteredRegistrations = useMemo(() => {
    if (activeTab === 'all') return registrations;
    return registrations.filter((r) => r.approval_status === activeTab);
  }, [registrations, activeTab]);

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.pending + counts.approved + counts.denied },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'denied', label: 'Denied', count: counts.denied },
  ];

  const handleApprove = async (registrationId: string) => {
    try {
      await approveRegistration.mutateAsync({ eventId, registrationId });
      toast.success('Registration approved');
    } catch {
      toast.error('Failed to approve registration');
    }
  };

  const handleDeny = async (registrationId: string) => {
    try {
      await denyRegistration.mutateAsync({
        eventId,
        registrationId,
        reason: denyReason || undefined,
      });
      toast.success('Registration denied');
      setDenyingId(null);
      setDenyReason('');
    } catch {
      toast.error('Failed to deny registration');
    }
  };

  const handleStartDeny = (registrationId: string) => {
    setDenyingId(registrationId);
    setDenyReason('');
  };

  const handleCancelDeny = () => {
    setDenyingId(null);
    setDenyReason('');
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

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          {/* Header skeleton */}
          <div className='flex items-center gap-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <Skeleton className='h-6 w-32' />
          </div>

          {/* Tabs skeleton */}
          <div className='flex space-x-1'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-20 rounded-lg' />
            ))}
          </div>

          {/* List skeleton */}
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center gap-4 border-b border-gray-100 p-4'>
        <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h1 className='text-xl font-semibold'>Registration Submissions</h1>
      </div>

      {/* Tabs */}
      <div className='px-4 pt-4'>
        <div className='flex space-x-1 overflow-x-auto pb-2'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 rounded-lg px-4 py-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className='ml-1 text-xs'>({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 p-4'>
        {filteredRegistrations.length > 0 ? (
          <div className='space-y-3'>
            {filteredRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                isDenying={denyingId === registration.id}
                denyReason={denyReason}
                onDenyReasonChange={setDenyReason}
                onApprove={() => handleApprove(registration.id)}
                onStartDeny={() => handleStartDeny(registration.id)}
                onConfirmDeny={() => handleDeny(registration.id)}
                onCancelDeny={handleCancelDeny}
                isApproving={approveRegistration.isPending}
                isDenyingMutation={denyRegistration.isPending}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <ClipboardList className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>No Submissions</h3>
            <p className='text-sm text-gray-500'>
              {activeTab === 'all' && 'No registrations have been submitted yet.'}
              {activeTab === 'pending' && 'No pending registrations to review.'}
              {activeTab === 'approved' && 'No approved registrations.'}
              {activeTab === 'denied' && 'No denied registrations.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className='border-t border-gray-100 bg-gray-50 p-4'>
        <div className='flex items-center justify-between text-sm text-gray-600'>
          <span>Total: {counts.pending + counts.approved + counts.denied}</span>
          <span>
            {activeTab === 'all' ? 'Showing all' : `Showing ${activeTab}`}:{' '}
            {filteredRegistrations.length}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RegistrationCardProps {
  registration: RegistrationSubmission;
  isDenying: boolean;
  denyReason: string;
  onDenyReasonChange: (reason: string) => void;
  onApprove: () => void;
  onStartDeny: () => void;
  onConfirmDeny: () => void;
  onCancelDeny: () => void;
  isApproving: boolean;
  isDenyingMutation: boolean;
  getStatusBadge: (status: RegistrationStatus) => React.ReactNode;
}

function RegistrationCard({
  registration,
  isDenying,
  denyReason,
  onDenyReasonChange,
  onApprove,
  onStartDeny,
  onConfirmDeny,
  onCancelDeny,
  isApproving,
  isDenyingMutation,
  getStatusBadge,
}: RegistrationCardProps) {
  const isPending = registration.approval_status === 'pending';

  return (
    <div className='rounded-2xl bg-gray-50 p-4'>
      <div className='flex items-start gap-4'>
        <UserAvatar
          user={{
            name: registration.user_details?.name || registration.name,
            username: registration.user_details?.username,
            image: registration.user_details?.image,
            verification_status: registration.user_details?.verification_status,
          }}
          height={48}
          width={48}
        />
        <div className='flex-1'>
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='font-semibold text-gray-900'>
                {registration.user_details?.name || registration.name}
              </h3>
              {registration.user_details?.username && (
                <p className='text-sm text-gray-500'>@{registration.user_details.username}</p>
              )}
              <p className='text-sm text-gray-500'>{registration.email}</p>
            </div>
            {getStatusBadge(registration.approval_status)}
          </div>
          <p className='mt-1 text-xs text-gray-400'>
            Submitted {format(new Date(registration.created_at), 'MMM d, yyyy h:mm a')}
          </p>
          {registration.reviewed_at && (
            <p className='text-xs text-gray-400'>
              Reviewed {format(new Date(registration.reviewed_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Actions for pending registrations */}
      {isPending && !isDenying && (
        <div className='mt-4 flex gap-2'>
          <button
            onClick={onApprove}
            disabled={isApproving}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50'
          >
            <Check className='h-4 w-4' />
            Approve
          </button>
          <button
            onClick={onStartDeny}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600'
          >
            <X className='h-4 w-4' />
            Deny
          </button>
        </div>
      )}

      {/* Deny reason input */}
      {isDenying && (
        <div className='mt-4 space-y-3'>
          <input
            type='text'
            placeholder='Reason for denial (optional)'
            value={denyReason}
            onChange={(e) => onDenyReasonChange(e.target.value)}
            className='w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-gray-400'
          />
          <div className='flex gap-2'>
            <button
              onClick={onConfirmDeny}
              disabled={isDenyingMutation}
              className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50'
            >
              Confirm Deny
            </button>
            <button
              onClick={onCancelDeny}
              disabled={isDenyingMutation}
              className='flex-1 rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
