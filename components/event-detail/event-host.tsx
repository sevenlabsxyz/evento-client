import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { Event } from '@/lib/types/event';

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
    <div className="py-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {event.hosts.length === 1 ? 'Host' : 'Hosts'}
        </h2>
        <span className="text-sm text-gray-500">Contact</span>
      </div>
      
      <div className="space-y-4">
        {event.hosts.map((host) => (
          <div key={host.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={host.avatar}
                  alt={host.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-500">@{host.username}</p>
                <h3 className="font-semibold text-gray-900">{host.name}</h3>
              </div>
            </div>
            
            {event.contactEnabled && (
              <button
                onClick={() => handleContactHost(host.id)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}