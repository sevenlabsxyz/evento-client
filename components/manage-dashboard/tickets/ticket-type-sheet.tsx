'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTicketType, useUpdateTicketType } from '@/lib/hooks/use-ticket-types';
import type { TicketCurrency, TicketType } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const TICKET_CURRENCIES: readonly TicketCurrency[] = ['USD', 'EUR', 'GBP', 'BRL', 'NGN'];

const ticketTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  description: z.string(),
  price_amount: z
    .number({ error: 'Enter a price (use 0 for free tickets)' })
    .min(0, 'Price must be 0 or more')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: 'Use at most 2 decimal places',
    }),
  price_currency: z.enum(['USD', 'EUR', 'GBP', 'BRL', 'NGN']),
  quantity_total: z
    .number({ error: 'Enter how many tickets are available' })
    .int('Quantity must be a whole number')
    .min(1, 'Must have at least 1 ticket'),
});

type TicketTypeFormData = z.infer<typeof ticketTypeFormSchema>;

const EMPTY_FORM: TicketTypeFormData = {
  name: '',
  description: '',
  price_amount: 0,
  price_currency: 'USD',
  quantity_total: 100,
};

function toFormData(ticketType: TicketType): TicketTypeFormData {
  return {
    name: ticketType.name,
    description: ticketType.description ?? '',
    price_amount: Number(ticketType.price_amount),
    price_currency: ticketType.price_currency,
    quantity_total: ticketType.quantity_total,
  };
}

const inputClassName =
  'h-12 rounded-xl bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500';
const labelClassName = 'text-sm font-medium text-gray-900 dark:text-neutral-100';
const errorClassName = 'text-sm text-red-600 dark:text-red-400';

interface TicketTypeSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ticket type being edited; omit or pass null to create a new one. */
  ticketType?: TicketType | null;
  /** sort_order assigned to newly created ticket types. */
  nextSortOrder: number;
}

export function TicketTypeSheet({
  eventId,
  open,
  onOpenChange,
  ticketType,
  nextSortOrder,
}: TicketTypeSheetProps) {
  const createTicketType = useCreateTicketType(eventId);
  const updateTicketType = useUpdateTicketType(eventId);
  const isEdit = Boolean(ticketType);
  const isLocked = (ticketType?.quantity_sold ?? 0) > 0;
  const isSaving = createTicketType.isPending || updateTicketType.isPending;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TicketTypeFormData>({
    resolver: zodResolver(ticketTypeFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (open) {
      reset(ticketType ? toFormData(ticketType) : EMPTY_FORM);
    }
  }, [open, ticketType, reset]);

  const onSubmit = async (data: TicketTypeFormData) => {
    const description = data.description.trim();

    try {
      if (ticketType) {
        await updateTicketType.mutateAsync({
          ticketTypeId: ticketType.id,
          name: data.name,
          description,
          price_amount: data.price_amount,
          price_currency: data.price_currency,
          quantity_total: data.quantity_total,
        });
        toast.success('Ticket type updated');
      } else {
        await createTicketType.mutateAsync({
          name: data.name,
          description: description || undefined,
          price_amount: data.price_amount,
          price_currency: data.price_currency,
          quantity_total: data.quantity_total,
          sort_order: nextSortOrder,
        });
        toast.success('Ticket type created');
      }
      onOpenChange(false);
    } catch (error) {
      const fallback = isEdit ? 'Failed to update ticket type' : 'Failed to create ticket type';
      toast.error(getErrorMessage(error) || fallback);
    }
  };

  const isDisabled = isSaving || isLocked;

  return (
    <MasterScrollableSheet
      title={isEdit ? 'Edit ticket type' : 'New ticket type'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className='px-4 pb-8'>
        {isLocked ? (
          <div className='mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'>
            <Lock className='mt-0.5 h-4 w-4 shrink-0' />
            <p>
              This ticket type has sales, so it can no longer be edited. Create a new ticket type to
              offer different pricing or quantities.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
          <div className='space-y-2'>
            <label htmlFor='ticket-type-name' className={labelClassName}>
              Name
            </label>
            <Input
              {...register('name')}
              id='ticket-type-name'
              placeholder='General admission'
              maxLength={100}
              disabled={isDisabled}
              aria-invalid={Boolean(errors.name)}
              className={inputClassName}
            />
            {errors.name ? <p className={errorClassName}>{errors.name.message}</p> : null}
          </div>

          <div className='space-y-2'>
            <label htmlFor='ticket-type-description' className={labelClassName}>
              Description <span className='text-gray-400 dark:text-neutral-500'>(optional)</span>
            </label>
            <Textarea
              {...register('description')}
              id='ticket-type-description'
              placeholder='What does this ticket include?'
              rows={3}
              disabled={isDisabled}
              className='rounded-xl bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500'
            />
          </div>

          <div className='space-y-2'>
            <span className={labelClassName}>Currency</span>
            <Controller
              control={control}
              name='price_currency'
              render={({ field }) => (
                <div role='radiogroup' aria-label='Currency' className='grid grid-cols-5 gap-2'>
                  {TICKET_CURRENCIES.map((currency) => {
                    const selected = field.value === currency;
                    return (
                      <button
                        key={currency}
                        type='button'
                        role='radio'
                        aria-checked={selected}
                        disabled={isDisabled}
                        onClick={() => field.onChange(currency)}
                        className={cn(
                          'h-10 rounded-xl border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          selected
                            ? 'border-gray-900 bg-gray-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        )}
                      >
                        {currency}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='ticket-type-price' className={labelClassName}>
                Price
              </label>
              <Input
                {...register('price_amount', { valueAsNumber: true })}
                id='ticket-type-price'
                type='number'
                inputMode='decimal'
                min={0}
                step='0.01'
                disabled={isDisabled}
                aria-invalid={Boolean(errors.price_amount)}
                className={inputClassName}
              />
              {errors.price_amount ? (
                <p className={errorClassName}>{errors.price_amount.message}</p>
              ) : (
                <p className='text-xs text-gray-500 dark:text-neutral-400'>0 makes it free.</p>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='ticket-type-quantity' className={labelClassName}>
                Quantity
              </label>
              <Input
                {...register('quantity_total', { valueAsNumber: true })}
                id='ticket-type-quantity'
                type='number'
                inputMode='numeric'
                min={1}
                step='1'
                disabled={isDisabled}
                aria-invalid={Boolean(errors.quantity_total)}
                className={inputClassName}
              />
              {errors.quantity_total ? (
                <p className={errorClassName}>{errors.quantity_total.message}</p>
              ) : (
                <p className='text-xs text-gray-500 dark:text-neutral-400'>Total available.</p>
              )}
            </div>
          </div>

          {!isEdit ? (
            <p className='text-xs text-gray-500 dark:text-neutral-400'>
              Ticket types can&apos;t be edited or removed once someone buys one.
            </p>
          ) : null}

          <Button
            type='submit'
            disabled={isDisabled || (isEdit && !isDirty)}
            className='h-12 w-full rounded-full'
          >
            {isSaving ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Create ticket type'
            )}
          </Button>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
