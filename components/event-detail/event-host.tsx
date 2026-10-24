'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { EventSection } from '@/components/event-detail/event-section';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserDetails } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface EventHostProps {
  event: EventDetail;
}

export default function EventHost({ event }: EventHostProps) {
  const t = useTranslations('event');
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
      <EventSection title={t('page.hostedBy')}>
        <ul className='-my-1 divide-y divide-gray-100 dark:divide-neutral-800'>
          {event.hosts.map((host) => (
            <li key={host.id} className='flex items-center justify-between gap-3 py-2'>
              <button
                type='button'
                onClick={() => handleHostClick(host)}
                className='-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
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
                  height={44}
                  width={44}
                />

                <span className='min-w-0 text-left'>
                  <span className='block truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                    {host.name}
                  </span>
                  <span className='block truncate text-sm text-gray-500 dark:text-neutral-500'>
                    @{host.username}
                  </span>
                </span>
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
            </li>
          ))}
        </ul>
      </EventSection>

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
