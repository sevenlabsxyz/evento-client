'use client';

import { Button } from '@/components/ui/button';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserDetails } from '@/lib/types/api';
import { Event } from '@/lib/types/event';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface EventHostProps {
  event: Event;
}

export default function EventHost({ event }: EventHostProps) {
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

              {event.contactEnabled && (
                <Button
                  variant='outline'
                  size='icon'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactHost(host.id);
                  }}
                  className='h-10 w-10 rounded-full border-gray-200 bg-gray-50'
                >
                  <MessageCircle className='h-4 w-4' />
                </Button>
              )}
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
