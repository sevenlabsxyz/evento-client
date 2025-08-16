import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types/event';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface EventHostProps {
  event: Event;
}

export default function EventHost({ event }: EventHostProps) {
  if (!event.hosts || event.hosts.length === 0) {
    return null;
  }

  const handleContactHost = (hostId: string) => {
    console.log('Contact host:', hostId);
  };

  return (
    <div className='py-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>
          {event.hosts.length === 1 ? 'Host' : 'Hosts'}
        </h2>
      </div>

      <div className='space-y-4'>
        {event.hosts.map((host) => (
          <div key={host.id} className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative h-12 w-12 overflow-hidden rounded-full bg-gray-200'>
                <Image src={host.avatar} alt={host.name} fill className='object-cover' />
              </div>

              <div>
                <p className='text-sm text-gray-500'>@{host.username}</p>
                <h3 className='font-semibold text-gray-900'>{host.name}</h3>
              </div>
            </div>

            {event.contactEnabled && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleContactHost(host.id)}
                className='gap-2'
              >
                <MessageCircle className='h-4 w-4' />
                <span>Contact</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
