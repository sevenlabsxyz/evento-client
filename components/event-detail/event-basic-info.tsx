'use client';

import { Event as ApiEvent } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useMemo } from 'react';

interface EventBasicInfoProps {
  event: EventDetail;
  eventData?: ApiEvent | null;
}

export default function EventBasicInfo({ event, eventData }: EventBasicInfoProps) {
  const isLocationHidden = eventData?.restricted_fields?.includes('location') ?? false;

  const startDate = useMemo(() => {
    if (!event.computedStartDate) return null;
    const d = new Date(event.computedStartDate);
    return {
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      fullDate: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, [event.computedStartDate]);

  const detailModuleBaseClassName =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50';

  return (
    <div className='space-y-3.5 py-4'>
      <span className='text-2xl font-bold text-black lg:text-3xl'>{event.title}</span>

      <div className='flex items-center gap-3.5'>
        <div className={`${detailModuleBaseClassName} flex-col`}>
          <span className='text-[8px] font-semibold uppercase leading-none text-gray-500'>
            {startDate?.monthShort}
          </span>
          <span className='text-sm font-bold leading-none text-gray-900'>{startDate?.day}</span>
        </div>
        <div className='flex flex-col'>
          <span className='text-[15px] font-semibold text-gray-900'>{startDate?.fullDate}</span>
          <span className='text-[13px] text-gray-500'>
            {event.startTime} - {event.endTime}
            {event.timezone && ` ${event.timezone}`}
          </span>
        </div>
      </div>

      {!isLocationHidden && (
        <div className='flex items-center gap-3.5'>
          <div className={detailModuleBaseClassName}>
            <MapPin className='h-4 w-4 text-gray-600' />
          </div>
          <div className='flex flex-col'>
            <div className='flex items-center gap-1'>
              <span className='text-[15px] font-semibold text-gray-900'>{event.location.name}</span>
              {event.location.name !== 'TBD' && (
                <ArrowUpRight className='h-3.5 w-3.5 text-gray-400' />
              )}
            </div>
            {(event.location.city || event.location.state) && (
              <span className='text-[13px] text-gray-500'>
                {event.location.city}
                {event.location.city && event.location.state && `, ${event.location.state}`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
