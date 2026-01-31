'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateTicketType,
  useTicketTypes,
  useUpdateTicketType,
} from '@/lib/hooks/use-ticket-types';
import { toast } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';

// Supported currencies
const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
  { value: 'BRL', label: 'BRL (R$)' },
  { value: 'NGN', label: 'NGN (\u20A6)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'MXN', label: 'MXN ($)' },
];

interface TicketTypeFormSheetProps {
  eventId: string;
  ticketTypeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketTypeFormSheet({
  eventId,
  ticketTypeId,
  open,
  onOpenChange,
}: TicketTypeFormSheetProps) {
  const { data: ticketTypes } = useTicketTypes(eventId);
  const createMutation = useCreateTicketType(eventId);
  const updateMutation = useUpdateTicketType(eventId);

  const isEditing = !!ticketTypeId;
  const existingType = ticketTypes?.find((t) => t.id === ticketTypeId);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [quantityTotal, setQuantityTotal] = useState('');

  // Reset form when opening/closing or changing ticket type
  useEffect(() => {
    if (open && existingType) {
      setName(existingType.name);
      setDescription(existingType.description || '');
      setPriceAmount(existingType.price_amount.toString());
      setPriceCurrency(existingType.price_currency);
      setQuantityTotal(existingType.quantity_total.toString());
    } else if (open && !isEditing) {
      setName('');
      setDescription('');
      setPriceAmount('');
      setPriceCurrency('USD');
      setQuantityTotal('');
    }
  }, [open, existingType, isEditing]);

  const handleSubmit = async () => {
    const data = {
      name,
      description: description || undefined,
      price_amount: parseFloat(priceAmount),
      price_currency: priceCurrency,
      quantity_total: parseInt(quantityTotal, 10),
    };

    try {
      if (isEditing && ticketTypeId) {
        await updateMutation.mutateAsync({ ticketTypeId, data });
        toast.success('Ticket type updated');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Ticket type created');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save ticket type');
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name && priceAmount && quantityTotal && !isSubmitting;

  return (
    <MasterScrollableSheet
      title={isEditing ? 'Edit Ticket Type' : 'Create Ticket Type'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className='space-y-6 px-4 pb-4'>
        {/* Name */}
        <div className='space-y-2'>
          <Label htmlFor='name'>Ticket Name</Label>
          <Input
            id='name'
            placeholder='e.g., General Admission'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <Label htmlFor='description'>Description (optional)</Label>
          <Textarea
            id='description'
            placeholder="What's included with this ticket?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Price */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='price'>Price</Label>
            <Input
              id='price'
              type='number'
              min='0'
              step='0.01'
              placeholder='0.00'
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='currency'>Currency</Label>
            <Select value={priceCurrency} onValueChange={setPriceCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quantity */}
        <div className='space-y-2'>
          <Label htmlFor='quantity'>Total Quantity</Label>
          <Input
            id='quantity'
            type='number'
            min='1'
            placeholder='100'
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(e.target.value)}
          />
          <p className='text-xs text-gray-500'>How many tickets of this type are available?</p>
        </div>

        {/* Warning for editing */}
        {isEditing && existingType && existingType.quantity_sold > 0 && (
          <div className='rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800'>
            <strong>Note:</strong> {existingType.quantity_sold} tickets have been sold. Some fields
            cannot be changed.
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            className='flex-1 rounded-full'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className='flex-1 rounded-full' onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? 'Save Changes' : 'Create Ticket'}
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
