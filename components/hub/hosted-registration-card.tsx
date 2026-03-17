'use client';

import { RegistrationDetailSheet } from '@/components/manage-event/registration-detail-sheet';
import { RegistrationFeedDetailSheet } from '@/components/manage-event/registration-feed-detail-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import type { HostedEventRegistration } from '@/lib/types/api';
import { getOptimizedCoverUrl, isGif } from '@/lib/utils/image';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HostedRegistrationCardProps {
  hostedEvent: HostedEventRegistration;
}

export function HostedRegistrationCard({ hostedEvent }: HostedRegistrationCardProps) {
  const router = useRouter();
  const approveRegistration = useApproveRegistration();
  const denyRegistration = useDenyRegistration();
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [isFeedSheetOpen, setIsFeedSheetOpen] = useState(false);

  const event = hostedEvent.event;
  const latestRegistrations = (hostedEvent.latest_registrations ?? []).slice(0, 5);
  const pendingCount = hostedEvent.registration_counts?.pending ?? latestRegistrations.length;
  const totalCount = hostedEvent.registration_counts?.total ?? latestRegistrations.length;
  const coverImage = event?.cover
    ? isGif(event.cover)
      ? event.cover
      : getOptimizedCoverUrl(event.cover, 'thumbnail')
    : null;
  const manageHref = `/e/${event.id}/manage/registration/submissions`;

  if (!event) {
    return null;
  }

  return (
    <>
      <div className='rounded-2xl border border-gray-200 bg-white p-4'>
        <div className='flex gap-3'>
          {coverImage && (
            <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg'>
              <Image src={coverImage} alt={event.title} fill className='object-cover' />
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <h3 className='truncate font-semibold text-gray-900'>{event.title}</h3>
                {event.location && (
                  <p className='truncate text-sm text-gray-500'>{event.location}</p>
                )}
                <p className='text-xs text-gray-400'>
                  {format(new Date(event.computed_start_date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <span className='rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600'>
                {pendingCount} pending
              </span>
            </div>
            <p className='mt-2 text-xs text-gray-500'>{totalCount} total registrations</p>
          </div>
        </div>

        <div className='mt-4 space-y-2'>
          {latestRegistrations.map((registration) => {
            const submittedBy = registration.user_details?.name || registration.name;
            const submittedMeta = registration.user_details?.username
              ? `@${registration.user_details.username}`
              : registration.email;
            const timeAgo = formatDistanceToNow(new Date(registration.created_at), {
              addSuffix: true,
            });

            return (
              <div
                key={registration.id}
                className='flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3'
              >
                <UserAvatar
                  user={{
                    name: submittedBy,
                    username: registration.user_details?.username,
                    image: registration.user_details?.image,
                    verification_status: registration.user_details?.verification_status,
                  }}
                  size='sm'
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-gray-900'>{submittedBy}</p>
                  <p className='truncate text-xs text-gray-500'>{submittedMeta}</p>
                  <p className='text-xs text-gray-400'>{timeAgo}</p>
                </div>
                <button
                  type='button'
                  onClick={() => setSelectedRegistrationId(registration.id)}
                  className='rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
                >
                  Details
                </button>
              </div>
            );
          })}
        </div>

        <div className='mt-4 flex gap-2'>
          <button
            type='button'
            onClick={() => setIsFeedSheetOpen(true)}
            className='flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            View All
          </button>
          <button
            type='button'
            onClick={() => router.push(manageHref)}
            className='flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700'
          >
            Manage
          </button>
        </div>
      </div>

      <RegistrationDetailSheet
        eventId={event.id}
        registrationId={selectedRegistrationId}
        isOpen={!!selectedRegistrationId}
        onClose={() => setSelectedRegistrationId(null)}
        onApprove={async (registrationId) => {
          await approveRegistration.mutateAsync({ eventId: event.id, registrationId });
        }}
        onDeny={async (registrationId, reason) => {
          await denyRegistration.mutateAsync({ eventId: event.id, registrationId, reason });
        }}
        isApproving={approveRegistration.isPending}
        isDenying={denyRegistration.isPending}
      />

      {isFeedSheetOpen && (
        <RegistrationFeedDetailSheet
          eventId={event.id}
          eventTitle={event.title}
          open={isFeedSheetOpen}
          onOpenChange={setIsFeedSheetOpen}
          manageHref={manageHref}
        />
      )}
    </>
  );
}
