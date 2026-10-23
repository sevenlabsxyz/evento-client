'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDetails } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { Zap } from 'lucide-react';
import { useState } from 'react';

interface EventHostProps {
  event: EventDetail;
}

export default function EventHost({ event }: EventHostProps) {
  const { user: loggedInUser } = useAuth();
  const [selectedHost, setSelectedHost] = useState<UserDetails | null>(null);

  if (!event.hosts || event.hosts.length === 0) {
    return null;
  }

  const handleHostClick = (host: EventDetail['hosts'][0]) => {
    const userDetails: UserDetails = {
      id: host.id,
      username: host.username,
      name: host.name,
      image: host.avatar,
      bio: '',
      verification_status: (host.verification_status as UserDetails['verification_status']) || null,
    };
    setSelectedHost(userDetails);
  };

  return (
    <>
      <div className='py-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {event.hosts.length === 1 ? 'Host' : 'Hosts'}
          </h2>
        </div>

        <div className='space-y-4'>
          {event.hosts.map((host) => (
            <div key={host.id} className='flex items-center justify-between'>
              <button
                onClick={() => handleHostClick(host)}
                className='-m-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2'
              >
                <UserAvatar
                  user={{
                    name: host.name,
                    username: host.username,
                    image: host.avatar,
                    verification_status:
                      host.verification_status as UserDetails['verification_status'],
                  }}
                  size='base'
                  height={48}
                  width={48}
                />

                <div className='min-w-0 text-left'>
                  <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                    @{host.username}
                  </p>
                  <h3 className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                    {host.name}
                  </h3>
                </div>
              </button>

              <div className='flex shrink-0 items-center gap-2'>
                <ZapSheet
                  recipientLightningAddress={`${host.username}@evento.cash`}
                  recipientName={host.name}
                  recipientUsername={host.username}
                  recipientAvatar={host.avatar}
                  currentUsername={loggedInUser?.username}
                >
                  <CircledIconButton icon={Zap} />
                </ZapSheet>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedHost && (
        <QuickProfileSheet
          isOpen={!!selectedHost}
          onClose={() => setSelectedHost(null)}
          user={selectedHost}
        />
      )}
    </>
  );
}
