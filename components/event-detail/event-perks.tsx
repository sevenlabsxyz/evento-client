import { Gift, Check } from 'lucide-react';
import { Event } from '@/lib/types/event';

interface EventPerksProps {
  event: Event;
}

export default function EventPerks({ event }: EventPerksProps) {
  if (!event.perks || event.perks.length === 0) {
    return null;
  }

  return (
    <div className="py-6 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Guest Perks
        </h2>
        {event.perks.some(perk => perk.isLimited) && (
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
            ** LIMITED **
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {event.perks.map((perk) => (
          <div key={perk.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {perk.title}
                </span>
                {perk.value && (
                  <span className="text-sm text-gray-500">
                    (valued at {perk.value})
                  </span>
                )}
                {perk.isLimited && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded">
                    LIMITED
                  </span>
                )}
              </div>
              {perk.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {perk.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}