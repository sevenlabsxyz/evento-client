'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicketTypes } from '@/lib/hooks/use-ticket-types';
import { TicketType } from '@/lib/types/api';
import { Minus, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { CheckoutSheet } from './checkout-sheet';

interface TicketSelectorProps {
  eventId: string;
}

// Format price helper
const formatPrice = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

interface TicketSelection {
  [ticketTypeId: string]: number;
}

export function TicketSelector({ eventId }: TicketSelectorProps) {
  const { data: ticketTypes, isLoading } = useTicketTypes(eventId);
  const [selections, setSelections] = useState<TicketSelection>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const updateQuantity = (typeId: string, delta: number) => {
    setSelections((prev) => {
      const current = prev[typeId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [typeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [typeId]: newValue };
    });
  };

  const getQuantity = (typeId: string) => selections[typeId] || 0;

  const totalTickets = Object.values(selections).reduce((sum, qty) => sum + qty, 0);

  const calculateTotal = () => {
    if (!ticketTypes) return { amount: 0, currency: 'USD' };

    let total = 0;
    let currency = 'USD';

    Object.entries(selections).forEach(([typeId, qty]) => {
      const type = ticketTypes.find((t) => t.id === typeId);
      if (type) {
        total += type.price_amount * qty;
        currency = type.price_currency;
      }
    });

    return { amount: total, currency };
  };

  const getSelectedItems = () => {
    if (!ticketTypes) return [];

    return Object.entries(selections)
      .filter(([_, qty]) => qty > 0)
      .map(([typeId, quantity]) => {
        const type = ticketTypes.find((t) => t.id === typeId)!;
        return { ticketType: type, quantity };
      });
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  const handleCheckoutComplete = () => {
    setCheckoutOpen(false);
    setSelections({});
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-6 w-24' />
        <Skeleton className='h-20 w-full rounded-xl' />
        <Skeleton className='h-20 w-full rounded-xl' />
      </div>
    );
  }

  if (!ticketTypes || ticketTypes.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
        <Ticket className='mx-auto h-8 w-8 text-gray-400' />
        <p className='mt-2 text-sm text-gray-600'>No tickets available</p>
      </div>
    );
  }

  const { amount: totalAmount, currency: totalCurrency } = calculateTotal();

  return (
    <>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Tickets</h3>

        <div className='space-y-3'>
          {ticketTypes.map((type) => (
            <TicketTypeCard
              key={type.id}
              type={type}
              quantity={getQuantity(type.id)}
              onIncrement={() => updateQuantity(type.id, 1)}
              onDecrement={() => updateQuantity(type.id, -1)}
            />
          ))}
        </div>

        {/* Checkout Button - Fixed at bottom when tickets selected */}
        {totalTickets > 0 && (
          <div className='fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 md:static md:border-0 md:bg-transparent md:p-0'>
            <div className='mx-auto max-w-full md:max-w-sm'>
              <Button className='w-full rounded-full py-6 text-base' onClick={handleCheckout}>
                Checkout ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}) -{' '}
                {formatPrice(totalAmount, totalCurrency)}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Sheet */}
      <CheckoutSheet
        eventId={eventId}
        selectedItems={getSelectedItems()}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onComplete={handleCheckoutComplete}
      />
    </>
  );
}

interface TicketTypeCardProps {
  type: TicketType;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function TicketTypeCard({ type, quantity, onIncrement, onDecrement }: TicketTypeCardProps) {
  const isSoldOut = type.is_sold_out || type.quantity_available === 0;
  const maxReached = quantity >= type.quantity_available;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isSoldOut ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
      }`}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='font-medium text-gray-900'>{type.name}</h4>
            {isSoldOut && (
              <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700'>
                Sold Out
              </span>
            )}
          </div>
          {type.description && <p className='mt-1 text-sm text-gray-500'>{type.description}</p>}
          <p className='mt-2 text-lg font-semibold text-gray-900'>
            {formatPrice(type.price_amount, type.price_currency)}
          </p>
          {!isSoldOut && (
            <p className='text-xs text-gray-500'>{type.quantity_available} available</p>
          )}
        </div>

        {/* Quantity Selector */}
        {!isSoldOut && (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 rounded-full'
              onClick={onDecrement}
              disabled={quantity === 0}
            >
              <Minus className='h-4 w-4' />
            </Button>
            <span className='w-8 text-center font-medium'>{quantity}</span>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8 rounded-full'
              onClick={onIncrement}
              disabled={maxReached}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
