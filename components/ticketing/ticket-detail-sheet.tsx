'use client';

import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicketDetail } from '@/lib/hooks/use-my-tickets';
import { formatEventDate } from '@/lib/utils/date';
import { Calendar, CheckCircle, Clock, ExternalLink, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';

interface TicketDetailSheetProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailSheet({ ticketId, open, onOpenChange }: TicketDetailSheetProps) {
  const { data: ticket, isLoading } = useTicketDetail(ticketId, { enabled: open && !!ticketId });

  if (isLoading || !ticket) {
    return (
      <MasterScrollableSheet title='Ticket' open={open} onOpenChange={onOpenChange}>
        <div className='space-y-6 px-4 pb-4'>
          <div className='flex justify-center'>
            <Skeleton className='h-64 w-64 rounded-2xl' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-40' />
          </div>
        </div>
      </MasterScrollableSheet>
    );
  }

  const { date, time } = formatEventDate(ticket.event.computed_start_date, ticket.event.timezone);
  const isCheckedIn = !!ticket.checked_in_at;

  return (
    <MasterScrollableSheet title='Your Ticket' open={open} onOpenChange={onOpenChange}>
      <div className='space-y-6 px-4 pb-4'>
        {/* QR Code */}
        <div className='flex justify-center'>
          <EventoQRCode value={ticket.check_in_token} size={250} />
        </div>

        {/* Status Badge */}
        {isCheckedIn && (
          <div className='flex items-center justify-center gap-2 rounded-full bg-green-100 py-2 text-sm font-medium text-green-700'>
            <CheckCircle className='h-4 w-4' />
            <span>Checked In</span>
          </div>
        )}

        {/* Ticket Type */}
        <div className='text-center'>
          <div className='inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2'>
            <Ticket className='h-4 w-4 text-gray-600' />
            <span className='font-medium text-gray-900'>{ticket.ticket_type_name}</span>
          </div>
        </div>

        {/* Event Info */}
        <div className='space-y-4 rounded-xl bg-gray-50 p-4'>
          <h3 className='text-lg font-semibold text-gray-900'>{ticket.event.title}</h3>

          <div className='space-y-2'>
            <div className='flex items-center gap-3 text-gray-600'>
              <Calendar className='h-4 w-4 text-gray-400' />
              <span>{date}</span>
            </div>
            <div className='flex items-center gap-3 text-gray-600'>
              <Clock className='h-4 w-4 text-gray-400' />
              <span>{time}</span>
            </div>
            {ticket.event.location && (
              <div className='flex items-center gap-3 text-gray-600'>
                <MapPin className='h-4 w-4 text-gray-400' />
                <span>{ticket.event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* View Event Button */}
        <Link href={`/e/${ticket.event.id}`} passHref>
          <Button
            variant='outline'
            className='w-full rounded-full'
            onClick={() => onOpenChange(false)}
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            View Event
          </Button>
        </Link>

        {/* Instructions */}
        <p className='text-center text-xs text-gray-500'>
          Show this QR code at the venue for check-in
        </p>
      </div>
    </MasterScrollableSheet>
  );
}
