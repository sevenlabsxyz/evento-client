'use client';

import { useAcceptCohostInvite, useRejectCohostInvite } from '@/lib/hooks/use-cohost-invites';
import { CohostInvite } from '@/lib/types/api';
import { getOptimizedCoverUrl, isGif } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { Check, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '../ui/user-avatar';

interface CohostInviteCardProps {
  invite: CohostInvite;
}

export function CohostInviteCard({ invite }: CohostInviteCardProps) {
  const router = useRouter();
  const acceptMutation = useAcceptCohostInvite();
  const rejectMutation = useRejectCohostInvite();
  const isPending = acceptMutation.isPending || rejectMutation.isPending;

  const event = invite.events;
  const inviter = invite.inviter;
  const timeAgo = formatDistanceToNow(new Date(invite.created_at), { addSuffix: true });
  const coverImage = event?.cover
    ? isGif(event.cover)
      ? event.cover
      : getOptimizedCoverUrl(event.cover, 'thumbnail')
    : null;
  const eventId = event?.id || invite.event_id;

  if (!event) return null;

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4'>
      <div className='mb-3 flex items-center gap-2'>
        {inviter && (
          <UserAvatar
            user={{
              name: inviter.name,
              username: inviter.username,
              image: inviter.image,
              verification_status: inviter.verification_status,
            }}
            size='xs'
          />
        )}
        <div className='min-w-0 flex-1'>
          <span className='text-sm text-gray-600'>
            <strong className='text-gray-900'>{inviter?.name || `@${inviter?.username}`}</strong>
            {' invited you to cohost'}
          </span>
        </div>
        <span className='flex-shrink-0 text-xs text-gray-400'>{timeAgo}</span>
      </div>

      <Link href={`/e/${event.id}`} className='block'>
        <div className='flex gap-3'>
          {coverImage && (
            <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg'>
              <Image src={coverImage} alt={event.title} fill className='object-cover' />
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <h3 className='truncate font-semibold text-gray-900'>{event.title}</h3>
            {event.location && <p className='truncate text-sm text-gray-500'>{event.location}</p>}
          </div>
        </div>
      </Link>

      {invite.message && (
        <div className='mt-3 rounded-xl bg-gray-50 p-3'>
          <p className='text-sm italic text-gray-700'>&quot;{invite.message}&quot;</p>
        </div>
      )}

      {invite.status === 'pending' && (
        <div className='mt-4 flex gap-2'>
          <button
            onClick={() =>
              acceptMutation.mutate(invite.id, {
                onSuccess: () => {
                  toast.info('Taking you to this event now', 'Redirecting');
                  router.push(`/e/${eventId}`);
                },
              })
            }
            disabled={isPending}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
          >
            {acceptMutation.isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Check className='h-4 w-4' />
            )}
            Accept
          </button>
          <button
            onClick={() => rejectMutation.mutate(invite.id)}
            disabled={isPending}
            className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            {rejectMutation.isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <X className='h-4 w-4' />
            )}
            Decline
          </button>
        </div>
      )}

      {invite.status === 'accepted' && (
        <div className='mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2.5 text-sm font-medium text-green-700'>
          <Check className='h-4 w-4' />
          Accepted
        </div>
      )}

      {invite.status === 'rejected' && (
        <div className='mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-500'>
          <X className='h-4 w-4' />
          Declined
        </div>
      )}
    </div>
  );
}
