'use client';

import { CohostInvite, HubSectionError } from '@/lib/types/api';
import { AlertTriangle } from 'lucide-react';
import { CohostInviteCard } from './cohost-invite-card';

interface CohostInvitesSectionProps {
  invites?: CohostInvite[];
  error?: HubSectionError;
}

export function CohostInvitesSection({ invites = [], error }: CohostInvitesSectionProps) {
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
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>Cohost Invitations</h2>
      </div>
      <div className='mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1'>
        {invites.map((invite) => (
          <div key={invite.id} className='w-[85vw] max-w-[400px] flex-none snap-start sm:w-[400px]'>
            <CohostInviteCard invite={invite} />
          </div>
        ))}
      </div>
    </div>
  );
}
