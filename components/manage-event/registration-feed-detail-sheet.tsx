'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RegistrationDetailSheet } from './registration-detail-sheet';

interface RegistrationFeedDetailSheetProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manageHref: string;
}

export function RegistrationFeedDetailSheet({
  eventId,
  eventTitle,
  open,
  onOpenChange,
  manageHref,
}: RegistrationFeedDetailSheetProps) {
  const router = useRouter();
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const { data, isLoading } = useRegistrationSubmissions(eventId, { status: 'pending' });
  const approveRegistration = useApproveRegistration();
  const denyRegistration = useDenyRegistration();

  const registrations = data?.registrations ?? [];

  const footer = (
    <Button
      className='w-full bg-red-600 text-white hover:bg-red-700'
      onClick={() => {
        onOpenChange(false);
        router.push(manageHref);
      }}
    >
      Open Manage Registration
      <ArrowUpRight className='ml-2 h-4 w-4' />
    </Button>
  );

  return (
    <>
      <MasterScrollableSheet
        title='Registration Requests'
        open={open}
        onOpenChange={onOpenChange}
        footer={footer}
      >
        <div className='px-4 pb-4'>
          <div className='mb-4'>
            <p className='text-sm text-gray-500'>{eventTitle}</p>
          </div>

          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`registration-feed-skeleton-${index + 1}`}
                  className='rounded-2xl border border-gray-100 bg-white p-4'
                >
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='min-w-0 flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                    <Skeleton className='h-9 w-16 rounded-xl' />
                  </div>
                </div>
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center'>
              <p className='text-sm text-gray-500'>No pending registrations right now.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {registrations.map((registration) => {
                const timeAgo = formatDistanceToNow(new Date(registration.created_at), {
                  addSuffix: true,
                });

                return (
                  <div
                    key={registration.id}
                    className='rounded-2xl border border-gray-200 bg-white p-4'
                  >
                    <div className='flex items-center gap-3'>
                      <UserAvatar
                        user={{
                          name: registration.user_details?.name || registration.name,
                          username: registration.user_details?.username,
                          image: registration.user_details?.image,
                          verification_status: registration.user_details?.verification_status,
                        }}
                        size='sm'
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold text-gray-900'>
                          {registration.user_details?.name || registration.name}
                        </p>
                        <p className='truncate text-xs text-gray-500'>
                          {registration.user_details?.username
                            ? `@${registration.user_details.username}`
                            : registration.email}
                        </p>
                        <p className='text-xs text-gray-400'>{timeAgo}</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setSelectedRegistrationId(registration.id)}
                        className='rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </MasterScrollableSheet>

      <RegistrationDetailSheet
        eventId={eventId}
        registrationId={selectedRegistrationId}
        isOpen={!!selectedRegistrationId}
        onClose={() => setSelectedRegistrationId(null)}
        onApprove={async (registrationId) => {
          await approveRegistration.mutateAsync({ eventId, registrationId });
        }}
        onDeny={async (registrationId, reason) => {
          await denyRegistration.mutateAsync({ eventId, registrationId, reason });
        }}
        isApproving={approveRegistration.isPending}
        isDenying={denyRegistration.isPending}
      />
    </>
  );
}
