'use client';

import { useMyHostedRegistrations } from '@/lib/hooks/use-my-hosted-registrations';
import { ClipboardList } from 'lucide-react';
import { HostedRegistrationCard } from './hosted-registration-card';

export function HostedRegistrationsSection() {
  const { data: hostedEvents = [], isLoading } = useMyHostedRegistrations('pending');

  const filteredEvents = hostedEvents.filter(
    (hostedEvent) =>
      (hostedEvent.registration_counts?.pending ?? 0) > 0 ||
      (hostedEvent.latest_registrations?.length ?? 0) > 0
  );
  const totalPendingRegistrations = filteredEvents.reduce(
    (sum, hostedEvent) => sum + (hostedEvent.registration_counts?.pending ?? 0),
    0
  );

  if (isLoading) {
    return (
      <div className='mb-6'>
        <h2 className='mb-3 text-lg font-semibold'>Registration Requests</h2>
        <div className='animate-pulse space-y-3'>
          <div className='h-48 rounded-2xl bg-gray-100' />
        </div>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return null;
  }

  return (
    <div className='mb-6'>
      <div className='mb-3 flex items-center gap-2'>
        <ClipboardList className='h-5 w-5 text-red-600' />
        <h2 className='text-lg font-semibold'>Registration Requests</h2>
        <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600'>
          {totalPendingRegistrations}
        </span>
      </div>
      <div className='space-y-3'>
        {filteredEvents.map((hostedEvent) => (
          <HostedRegistrationCard key={hostedEvent.event.id} hostedEvent={hostedEvent} />
        ))}
      </div>
    </div>
  );
}
