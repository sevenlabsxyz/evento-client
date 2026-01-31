'use client';

import { TicketDetailSheet } from '@/components/ticketing/ticket-detail-sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClaimTickets, useMyTickets, usePendingTicketClaims } from '@/lib/hooks/use-my-tickets';
import { TicketWithEvent } from '@/lib/types/api';
import { formatEventDate } from '@/lib/utils/date';
import { getOptimizedCoverUrl } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { Calendar, Gift, Ticket } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function MyTicketsSection() {
  const { data: ticketsData, isLoading: ticketsLoading } = useMyTickets();
  const { data: claimsData, isLoading: claimsLoading } = usePendingTicketClaims();
  const claimMutation = useClaimTickets();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const tickets = ticketsData?.tickets || [];
  const pendingClaims = claimsData?.claims || [];
  const isLoading = ticketsLoading || claimsLoading;

  // Filter to upcoming tickets (event date in future)
  const upcomingTickets = tickets.filter((ticket) => {
    const eventDate = new Date(ticket.event.computed_start_date);
    return eventDate >= new Date();
  });

  const handleClaim = async () => {
    try {
      const result = await claimMutation.mutateAsync();
      toast.success(
        `Claimed ${result.claimedCount} ticket${result.claimedCount !== 1 ? 's' : ''}!`
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim tickets');
    }
  };

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setDetailSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-24 w-full rounded-xl' />
        <Skeleton className='h-24 w-full rounded-xl' />
      </div>
    );
  }

  // Don't render if no tickets and no pending claims
  if (upcomingTickets.length === 0 && pendingClaims.length === 0) {
    return null;
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold text-gray-900'>My Tickets</h2>

      {/* Pending Claims Banner */}
      {pendingClaims.length > 0 && (
        <div className='flex items-center justify-between rounded-xl bg-amber-50 p-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
              <Gift className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <p className='font-medium text-amber-900'>
                {pendingClaims.length} ticket{pendingClaims.length !== 1 ? 's' : ''} waiting
              </p>
              <p className='text-sm text-amber-700'>Tickets sent to your email</p>
            </div>
          </div>
          <Button
            size='sm'
            className='rounded-full bg-amber-600 hover:bg-amber-700'
            onClick={handleClaim}
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? 'Claiming...' : 'Claim'}
          </Button>
        </div>
      )}

      {/* Tickets List */}
      {upcomingTickets.length > 0 ? (
        <div className='space-y-3'>
          {upcomingTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket.id)}
            />
          ))}
        </div>
      ) : (
        pendingClaims.length === 0 && (
          <div className='rounded-xl bg-gray-50 p-6 text-center'>
            <Ticket className='mx-auto h-8 w-8 text-gray-400' />
            <p className='mt-2 text-sm text-gray-600'>No upcoming tickets</p>
          </div>
        )
      )}

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        ticketId={selectedTicketId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}

interface TicketCardProps {
  ticket: TicketWithEvent;
  onClick: () => void;
}

function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { date, time } = formatEventDate(ticket.event.computed_start_date, ticket.event.timezone);
  const isCheckedIn = !!ticket.checked_in_at;

  return (
    <button
      onClick={onClick}
      className='flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50'
    >
      {/* Event Image */}
      <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg'>
        {ticket.event.cover ? (
          <Image
            src={getOptimizedCoverUrl(ticket.event.cover, 'feed')}
            alt={ticket.event.title}
            fill
            className='object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gray-100'>
            <Ticket className='h-6 w-6 text-gray-400' />
          </div>
        )}
      </div>

      {/* Ticket Info */}
      <div className='min-w-0 flex-1'>
        <p className='truncate font-medium text-gray-900'>{ticket.event.title}</p>
        <p className='text-sm text-gray-500'>{ticket.ticket_type_name}</p>
        <div className='mt-1 flex items-center gap-1 text-xs text-gray-400'>
          <Calendar className='h-3 w-3' />
          <span>
            {date} at {time}
          </span>
        </div>
      </div>

      {/* Status */}
      {isCheckedIn ? (
        <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700'>
          Checked In
        </span>
      ) : (
        <Ticket className='h-5 w-5 text-gray-400' />
      )}
    </button>
  );
}
