'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCreateDiscountCode, useUpdateDiscountCode } from '@/lib/hooks/use-discount-codes';
import type { DiscountCode } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const usageLimitSchema = z
  .number({ error: 'Enter how many times the code can be used' })
  .int('Usage limit must be a whole number')
  .min(1, 'Must allow at least 1 use');

const createDiscountCodeFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or fewer')
    .regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, dashes or underscores'),
  percentage: z
    .number({ error: 'Enter a discount percentage' })
    .int('Percentage must be a whole number')
    .min(1, 'Minimum 1%')
    .max(100, 'Maximum 100%'),
  usage_limit: usageLimitSchema,
});

type CreateDiscountCodeFormData = z.infer<typeof createDiscountCodeFormSchema>;

const editDiscountCodeFormSchema = z.object({
  usage_limit: usageLimitSchema,
});

type EditDiscountCodeFormData = z.infer<typeof editDiscountCodeFormSchema>;

const CREATE_DEFAULTS: CreateDiscountCodeFormData = {
  code: '',
  percentage: 10,
  usage_limit: 50,
};

const inputClassName =
  'h-12 rounded-xl bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500';
const labelClassName = 'text-sm font-medium text-gray-900 dark:text-neutral-100';
const errorClassName = 'text-sm text-red-600 dark:text-red-400';
const hintClassName = 'text-xs text-gray-500 dark:text-neutral-400';

interface DiscountCodeSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Code whose usage limit is being edited; omit or pass null to create a new code. */
  discountCode?: DiscountCode | null;
}

export function DiscountCodeSheet({
  eventId,
  open,
  onOpenChange,
  discountCode,
}: DiscountCodeSheetProps) {
  return (
    <MasterScrollableSheet
      title={discountCode ? 'Edit discount code' : 'New discount code'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className='px-4 pb-8'>
        {discountCode ? (
          <EditDiscountCodeForm
            eventId={eventId}
            open={open}
            discountCode={discountCode}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <CreateDiscountCodeForm
            eventId={eventId}
            open={open}
            onDone={() => onOpenChange(false)}
          />
        )}
      </div>
    </MasterScrollableSheet>
  );
}

interface CreateDiscountCodeFormProps {
  eventId: string;
  open: boolean;
  onDone: () => void;
}

function CreateDiscountCodeForm({ eventId, open, onDone }: CreateDiscountCodeFormProps) {
  const createDiscountCode = useCreateDiscountCode(eventId);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDiscountCodeFormData>({
    resolver: zodResolver(createDiscountCodeFormSchema),
    mode: 'onTouched',
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(CREATE_DEFAULTS);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateDiscountCodeFormData) => {
    try {
      await createDiscountCode.mutateAsync(data);
      toast.success(`Discount code ${data.code} created`);
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to create discount code');
    }
  };

  const isSaving = createDiscountCode.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
      <div className='space-y-2'>
        <label htmlFor='discount-code' className={labelClassName}>
          Code
        </label>
        <Controller
          control={control}
          name='code'
          render={({ field }) => (
            <Input
              id='discount-code'
              ref={field.ref}
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(event.target.value.toUpperCase().replace(/\s+/g, ''))
              }
              placeholder='EARLYBIRD'
              maxLength={50}
              autoCapitalize='characters'
              autoComplete='off'
              spellCheck={false}
              disabled={isSaving}
              aria-invalid={Boolean(errors.code)}
              className={`${inputClassName} font-mono tracking-wide`}
            />
          )}
        />
        {errors.code ? (
          <p className={errorClassName}>{errors.code.message}</p>
        ) : (
          <p className={hintClassName}>Buyers enter this at checkout. Codes are uppercase.</p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label htmlFor='discount-percentage' className={labelClassName}>
            Discount (%)
          </label>
          <Input
            {...register('percentage', { valueAsNumber: true })}
            id='discount-percentage'
            type='number'
            inputMode='numeric'
            min={1}
            max={100}
            step='1'
            disabled={isSaving}
            aria-invalid={Boolean(errors.percentage)}
            className={inputClassName}
          />
          {errors.percentage ? (
            <p className={errorClassName}>{errors.percentage.message}</p>
          ) : (
            <p className={hintClassName}>1–100% off.</p>
          )}
        </div>

        <div className='space-y-2'>
          <label htmlFor='discount-usage-limit' className={labelClassName}>
            Usage limit
          </label>
          <Input
            {...register('usage_limit', { valueAsNumber: true })}
            id='discount-usage-limit'
            type='number'
            inputMode='numeric'
            min={1}
            step='1'
            disabled={isSaving}
            aria-invalid={Boolean(errors.usage_limit)}
            className={inputClassName}
          />
          {errors.usage_limit ? (
            <p className={errorClassName}>{errors.usage_limit.message}</p>
          ) : (
            <p className={hintClassName}>Total redemptions.</p>
          )}
        </div>
      </div>

      <p className={hintClassName}>
        The code and percentage can&apos;t be changed after creation. You can adjust the usage limit
        or pause the code later.
      </p>

      <Button type='submit' disabled={isSaving} className='h-12 w-full rounded-full'>
        {isSaving ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            Creating...
          </>
        ) : (
          'Create discount code'
        )}
      </Button>
    </form>
  );
}

interface EditDiscountCodeFormProps {
  eventId: string;
  open: boolean;
  discountCode: DiscountCode;
  onDone: () => void;
}

function EditDiscountCodeForm({ eventId, open, discountCode, onDone }: EditDiscountCodeFormProps) {
  const updateDiscountCode = useUpdateDiscountCode(eventId);
  const minimumLimit = Math.max(1, discountCode.usage_count);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<EditDiscountCodeFormData>({
    resolver: zodResolver(editDiscountCodeFormSchema),
    mode: 'onTouched',
    defaultValues: { usage_limit: discountCode.usage_limit },
  });

  useEffect(() => {
    if (open) {
      reset({ usage_limit: discountCode.usage_limit });
    }
  }, [open, discountCode.usage_limit, reset]);

  const onSubmit = async (data: EditDiscountCodeFormData) => {
    if (data.usage_limit < minimumLimit) {
      setError('usage_limit', {
        type: 'manual',
        message: `Already used ${discountCode.usage_count} times — limit must be at least ${minimumLimit}`,
      });
      return;
    }

    try {
      await updateDiscountCode.mutateAsync({
        codeId: discountCode.id,
        usage_limit: data.usage_limit,
      });
      toast.success(`${discountCode.code} updated`);
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to update discount code');
    }
  };

  const isSaving = updateDiscountCode.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
      <div className='flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
        <div>
          <p className='font-mono text-base font-semibold tracking-wide text-gray-900 dark:text-neutral-100'>
            {discountCode.code}
          </p>
          <p className={hintClassName}>
            {discountCode.usage_count} of {discountCode.usage_limit} used
          </p>
        </div>
        <span className='rounded-full bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400'>
          {discountCode.percentage}% off
        </span>
      </div>

      <div className='space-y-2'>
        <label htmlFor='discount-edit-usage-limit' className={labelClassName}>
          Usage limit
        </label>
        <Input
          {...register('usage_limit', { valueAsNumber: true })}
          id='discount-edit-usage-limit'
          type='number'
          inputMode='numeric'
          min={minimumLimit}
          step='1'
          disabled={isSaving}
          aria-invalid={Boolean(errors.usage_limit)}
          className={inputClassName}
        />
        {errors.usage_limit ? (
          <p className={errorClassName}>{errors.usage_limit.message}</p>
        ) : (
          <p className={hintClassName}>
            Code and percentage are fixed. Only the usage limit can be changed.
          </p>
        )}
      </div>

      <Button type='submit' disabled={isSaving || !isDirty} className='h-12 w-full rounded-full'>
        {isSaving ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            Saving...
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  );
}
