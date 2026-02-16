'use client';

import { RegistrationDetailSheet } from '@/components/manage-event/registration-detail-sheet';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { RegistrationStatus, RegistrationSubmission } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { format } from 'date-fns';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabStatus = RegistrationStatus;

export default function RegistrationSubmissionsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Registration Submissions',
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
      textButtons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute]);

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

  const isLoadingInitialPage = isLoadingEvent;

  const registrations = submissionsData?.registrations ?? [];
  const filteredRegistrations = registrations.filter(
    (registration) => registration.approval_status === activeTab
  );
  const counts = submissionsData?.counts ?? { pending: 0, approved: 0, denied: 0 };
  const totalCount = counts.pending + counts.approved + counts.denied;

  const tabs: { key: TabStatus; label: string; count: number }[] = [
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

  const handleDeny = async (registrationId: string, reason?: string) => {
    try {
      await denyRegistration.mutateAsync({
        eventId,
        registrationId,
        reason,
      });
      toast.success('Registration denied');
    } catch {
      toast.error('Failed to deny registration');
    }
  };

  const handleOpenDetail = (registrationId: string) => {
    setSelectedRegistrationId(registrationId);
  };

  const handleCloseDetail = () => {
    setSelectedRegistrationId(null);
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

  if (isLoadingInitialPage) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='border-b border-gray-100 px-4 py-4'>
          <div className='flex space-x-1'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-20 rounded-lg' />
            ))}
          </div>
        </div>

        <div className='flex-1 space-y-3 overflow-y-auto p-4'>
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

        <div className='border-t border-gray-100 bg-gray-50 p-4'>
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-24' />
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
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Tabs */}
      <div className='border-b border-gray-100 px-4 py-4'>
        <SegmentedTabs
          align='left'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabStatus)}
          wrapperClassName='mb-0 px-0 py-0'
          items={tabs.map((tab) => ({
            value: tab.key,
            label: tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label,
          }))}
        />
      </div>

      {/* Content */}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4'>
        {isLoadingSubmissions ? (
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
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
        ) : filteredRegistrations.length > 0 ? (
          <div className='space-y-3'>
            {filteredRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onClick={() => handleOpenDetail(registration.id)}
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
              {activeTab === 'pending' && 'No pending registrations to review.'}
              {activeTab === 'approved' && 'No approved registrations.'}
              {activeTab === 'denied' && 'No denied registrations.'}
            </p>
          </div>
        )}
      </div>

      {/* Registration Detail Sheet */}
      <RegistrationDetailSheet
        eventId={eventId}
        registrationId={selectedRegistrationId}
        isOpen={!!selectedRegistrationId}
        onClose={handleCloseDetail}
        onApprove={handleApprove}
        onDeny={handleDeny}
        isApproving={approveRegistration.isPending}
        isDenying={denyRegistration.isPending}
      />

      {/* Summary Footer */}
      <div className='shrink-0 border-t border-gray-100 bg-gray-50 p-4'>
        {isLoadingSubmissions ? (
          <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-24' />
          </div>
        ) : (
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <span>Total: {totalCount}</span>
            <span>
              Showing {activeTab}: {filteredRegistrations.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface RegistrationCardProps {
  registration: RegistrationSubmission;
  onClick: () => void;
  getStatusBadge: (status: RegistrationStatus) => React.ReactNode;
}

function RegistrationCard({ registration, onClick, getStatusBadge }: RegistrationCardProps) {
  return (
    <button
      onClick={onClick}
      className='w-full rounded-2xl bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100'
    >
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
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <h3 className='truncate font-semibold text-gray-900'>
                {registration.user_details?.name || registration.name}
              </h3>
              {registration.user_details?.username && (
                <p className='truncate text-sm text-gray-500'>
                  @{registration.user_details.username}
                </p>
              )}
            </div>
            <div className='flex flex-shrink-0 items-center gap-2'>
              {getStatusBadge(registration.approval_status)}
              <ChevronRight className='h-5 w-5 text-gray-400' />
            </div>
          </div>
          <p className='mt-1 text-xs text-gray-400'>
            Submitted {format(new Date(registration.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </button>
  );
}
