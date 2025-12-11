'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDetails } from '@/lib/types/api';
import { Event } from '@/lib/types/event';
import { MessageCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface EventHostProps {
  event: Event;
}

export default function EventHost({ event }: EventHostProps) {
  const { user: loggedInUser } = useAuth();
  const [selectedHost, setSelectedHost] = useState<UserDetails | null>(null);

  if (!event.hosts || event.hosts.length === 0) {
    return null;
  }

  const handleContactHost = (hostId: string) => {
    console.log('Contact host:', hostId);
  };

  const handleHostClick = (host: Event['hosts'][0]) => {
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
          <h2 className='text-lg font-semibold text-gray-900'>
            {event.hosts.length === 1 ? 'Host' : 'Hosts'}
          </h2>
        </div>

        <div className='space-y-4'>
          {event.hosts.map((host) => (
            <div key={host.id} className='flex items-center justify-between'>
              <button
                onClick={() => handleHostClick(host)}
                className='-m-2 flex flex-1 items-center gap-3 rounded-lg p-2'
              >
                <UserAvatar
                  user={{
                    name: host.name,
                    username: host.username,
                    image: host.avatar,
                    verification_status:
                      host.verification_status as UserDetails['verification_status'],
                  }}
                  size='md'
                />

                <div className='text-left'>
                  <p className='text-sm text-gray-500'>@{host.username}</p>
                  <h3 className='font-semibold text-gray-900'>{host.name}</h3>
                </div>
              </button>

              <div className='flex items-center gap-2'>
                <ZapSheet
                  recipientLightningAddress={`${host.username}@evento.cash`}
                  recipientName={host.name}
                  recipientUsername={host.username}
                  recipientAvatar={host.avatar}
                  currentUsername={loggedInUser?.username}
                >
                  <CircledIconButton icon={Zap} />
                </ZapSheet>
                {event.contactEnabled && (
                  <CircledIconButton
                    icon={MessageCircle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactHost(host.id);
                    }}
                  />
                )}
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
