'use client';

import { DiscountCodesSection } from '@/components/ticketing/discount-codes-section';
import { TicketTypeFormSheet } from '@/components/ticketing/ticket-type-form-sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useDeleteTicketType, useTicketTypes } from '@/lib/hooks/use-ticket-types';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { MoreVertical, Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Format price helper
const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export default function TicketsManagePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const eventId = params.id as string;

  const { data: event, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
  const { data: ticketTypes, isLoading: typesLoading } = useTicketTypes(eventId);
  const deleteTicketType = useDeleteTicketType(eventId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Tickets',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, pathname, setTopBarForRoute]);

  const handleEdit = (ticketTypeId: string) => {
    setEditingTypeId(ticketTypeId);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    setEditingTypeId(null);
    setSheetOpen(true);
  };

  const handleDelete = async (ticketTypeId: string) => {
    const type = ticketTypes?.find((t) => t.id === ticketTypeId);
    if (type && type.quantity_sold > 0) {
      toast.error('Cannot delete ticket type with sold tickets');
      return;
    }

    try {
      await deleteTicketType.mutateAsync(ticketTypeId);
      toast.success('Ticket type deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ticket type');
    }
  };

  const isLoading = eventLoading || typesLoading;

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-9 w-24 rounded-full' />
          </div>
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-xl' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to manage doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      <div className='space-y-6 p-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Ticket Types</h2>
          <Button size='sm' onClick={handleCreate} className='rounded-full'>
            <Plus className='mr-2 h-4 w-4' />
            Add Ticket
          </Button>
        </div>

        {/* Ticket Types List */}
        {ticketTypes && ticketTypes.length > 0 ? (
          <div className='space-y-3'>
            {ticketTypes.map((type) => (
              <div
                key={type.id}
                className='flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
                    <Ticket className='h-5 w-5 text-gray-600' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>{type.name}</p>
                    <p className='text-sm text-gray-500'>
                      {formatPrice(type.price_amount, type.price_currency)}
                      {' \u00B7 '}
                      {type.quantity_sold}/{type.quantity_total} sold
                    </p>
                    {type.is_sold_out && (
                      <span className='text-xs font-medium text-red-600'>Sold out</span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='rounded-full'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => handleEdit(type.id)}>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(type.id)}
                      disabled={type.quantity_sold > 0}
                      className='text-red-600'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center'>
            <Ticket className='mx-auto h-8 w-8 text-gray-400' />
            <p className='mt-2 text-sm text-gray-600'>No ticket types yet</p>
            <Button size='sm' onClick={handleCreate} className='mt-4 rounded-full'>
              <Plus className='mr-2 h-4 w-4' />
              Create your first ticket
            </Button>
          </div>
        )}

        {/* Discount Codes Section */}
        <DiscountCodesSection eventId={eventId} />
      </div>

      {/* Create/Edit Sheet */}
      <TicketTypeFormSheet
        eventId={eventId}
        ticketTypeId={editingTypeId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
