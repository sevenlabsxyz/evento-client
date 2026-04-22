'use client';

import { AlertTriangle, Users } from '@/components/icons/lucide';
import { CohostInvite, HubSectionError } from '@/lib/types/api';
import { CohostInviteCard } from './cohost-invite-card';

interface CohostInvitesSectionProps {
  invites?: CohostInvite[];
  totalCount?: number | null;
  error?: HubSectionError;
}

export function CohostInvitesSection({
  invites = [],
  totalCount,
  error,
}: CohostInvitesSectionProps) {
  if (error) {
    return (
      <div className='mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900'>
        <div className='mb-2 flex items-center gap-2 text-sm font-semibold'>
          <AlertTriangle className='h-4 w-4' />
          Cohost invitations are temporarily unavailable
        </div>
        <p className='text-sm text-amber-800'>{error.message}</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className='mb-6'>
      <div className='mb-3 flex items-center gap-2'>
        <Users className='h-5 w-5 text-red-600' />
        <h2 className='text-lg font-semibold'>Cohost Invitations</h2>
        <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600'>
          {totalCount ?? invites.length}
        </span>
      </div>
      <div className='space-y-3'>
        {invites.map((invite) => (
          <CohostInviteCard key={invite.id} invite={invite} />
        ))}
      </div>
    </div>
  );
}
