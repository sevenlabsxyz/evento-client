import { Event } from '@/lib/types/event';
import { Check, Gift } from 'lucide-react';

interface EventPerksProps {
  event: Event;
}

export default function EventPerks({ event }: EventPerksProps) {
  if (!event.perks || event.perks.length === 0) {
    return null;
  }

  return (
    <div className='border-t border-gray-100 py-6'>
      <div className='mb-4 flex items-center gap-2'>
        <Gift className='h-5 w-5 text-red-500' />
        <h2 className='text-lg font-semibold text-gray-900'>Guest Perks</h2>
        {event.perks.some((perk) => perk.isLimited) && (
          <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600'>
            ** LIMITED **
          </span>
        )}
      </div>

      <div className='space-y-3'>
        {event.perks.map((perk) => (
          <div key={perk.id} className='flex items-start gap-3'>
            <div className='mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100'>
              <Check className='h-3 w-3 text-green-600' />
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-gray-900'>{perk.title}</span>
                {perk.value && (
                  <span className='text-sm text-gray-500'>(valued at {perk.value})</span>
                )}
                {perk.isLimited && (
                  <span className='rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600'>
                    LIMITED
                  </span>
                )}
              </div>
              {perk.description && <p className='mt-1 text-sm text-gray-600'>{perk.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
