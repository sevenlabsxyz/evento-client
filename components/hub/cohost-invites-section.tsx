'use client';

import { useMyCohostInvites } from '@/lib/hooks/use-cohost-invites';
import { Users } from 'lucide-react';
import { CohostInviteCard } from './cohost-invite-card';

export function CohostInvitesSection() {
  const { data: pendingInvites = [], isLoading } = useMyCohostInvites('pending');

  if (isLoading) {
    return (
      <div className='mb-6'>
        <h2 className='mb-3 text-lg font-semibold'>Cohost Invitations</h2>
        <div className='animate-pulse space-y-3'>
          <div className='h-32 rounded-2xl bg-gray-100' />
        </div>
      </div>
    );
  }

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className='mb-6'>
      <div className='mb-3 flex items-center gap-2'>
        <Users className='h-5 w-5 text-red-600' />
        <h2 className='text-lg font-semibold'>Cohost Invitations</h2>
        <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600'>
          {pendingInvites.length}
        </span>
      </div>
      <div className='space-y-3'>
        {pendingInvites.map((invite) => (
          <CohostInviteCard key={invite.id} invite={invite} />
        ))}
      </div>
    </div>
  );
}
