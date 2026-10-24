'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCreateDiscountCode, useUpdateDiscountCode } from '@/lib/hooks/use-discount-codes';
import type { Translator } from '@/lib/i18n/types';
import type { DiscountCode } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

type ManageTranslator = Translator<'manage'>;

function buildUsageLimitSchema(t: ManageTranslator) {
  return z
    .number({ error: t('discountCodeSheet.validation.usageLimitRequired') })
    .int(t('discountCodeSheet.validation.usageLimitInteger'))
    .min(1, t('discountCodeSheet.validation.usageLimitMin'));
}

function buildCreateDiscountCodeFormSchema(t: ManageTranslator) {
  return z.object({
    code: z
      .string()
      .min(1, t('discountCodeSheet.validation.codeRequired'))
      .max(50, t('discountCodeSheet.validation.codeMax'))
      .regex(/^[A-Z0-9_-]+$/, t('discountCodeSheet.validation.codeFormat')),
    percentage: z
      .number({ error: t('discountCodeSheet.validation.percentageRequired') })
      .int(t('discountCodeSheet.validation.percentageInteger'))
      .min(1, t('discountCodeSheet.validation.percentageMin'))
      .max(100, t('discountCodeSheet.validation.percentageMax')),
    usage_limit: buildUsageLimitSchema(t),
  });
}

type CreateDiscountCodeFormData = z.infer<ReturnType<typeof buildCreateDiscountCodeFormSchema>>;

function buildEditDiscountCodeFormSchema(t: ManageTranslator) {
  return z.object({
    usage_limit: buildUsageLimitSchema(t),
  });
}

type EditDiscountCodeFormData = z.infer<ReturnType<typeof buildEditDiscountCodeFormSchema>>;

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
  const t = useTranslations('manage');
  return (
    <MasterScrollableSheet
      title={discountCode ? t('discountCodeSheet.editTitle') : t('discountCodeSheet.newTitle')}
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
  const t = useTranslations('manage');
  const createDiscountCodeFormSchema = useMemo(() => buildCreateDiscountCodeFormSchema(t), [t]);
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
      toast.success(t('discountCodeSheet.createdToast', { code: data.code }));
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error) || t('discountCodeSheet.createError'));
    }
  };

  const isSaving = createDiscountCode.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
      <div className='space-y-2'>
        <label htmlFor='discount-code' className={labelClassName}>
          {t('discountCodeSheet.codeLabel')}
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
          <p className={hintClassName}>{t('discountCodeSheet.codeHint')}</p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label htmlFor='discount-percentage' className={labelClassName}>
            {t('discountCodeSheet.percentageLabel')}
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
            <p className={hintClassName}>{t('discountCodeSheet.percentageHint')}</p>
          )}
        </div>

        <div className='space-y-2'>
          <label htmlFor='discount-usage-limit' className={labelClassName}>
            {t('discountCodeSheet.usageLimitLabel')}
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
            <p className={hintClassName}>{t('discountCodeSheet.usageLimitHint')}</p>
          )}
        </div>
      </div>

      <p className={hintClassName}>{t('discountCodeSheet.immutableNotice')}</p>

      <Button type='submit' disabled={isSaving} className='h-12 w-full rounded-full'>
        {isSaving ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            {t('discountCodeSheet.creating')}
          </>
        ) : (
          t('discountCodeSheet.createSubmit')
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
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const editDiscountCodeFormSchema = useMemo(() => buildEditDiscountCodeFormSchema(t), [t]);
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
        message: t('discountCodeSheet.validation.usageLimitBelowUsed', {
          count: discountCode.usage_count,
          minimum: minimumLimit,
        }),
      });
      return;
    }

    try {
      await updateDiscountCode.mutateAsync({
        codeId: discountCode.id,
        usage_limit: data.usage_limit,
      });
      toast.success(t('discountCodeSheet.updatedToast', { code: discountCode.code }));
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error) || t('discountCodeSheet.updateError'));
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
            {t('discountCodeSheet.usageSummary', {
              used: discountCode.usage_count,
              limit: discountCode.usage_limit,
            })}
          </p>
        </div>
        <span className='rounded-full bg-red-100 px-2.5 py-1 text-sm font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-400'>
          {t('discountCodeSheet.percentOff', { percentage: discountCode.percentage })}
        </span>
      </div>

      <div className='space-y-2'>
        <label htmlFor='discount-edit-usage-limit' className={labelClassName}>
          {t('discountCodeSheet.usageLimitLabel')}
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
          <p className={hintClassName}>{t('discountCodeSheet.editHint')}</p>
        )}
      </div>

      <Button type='submit' disabled={isSaving || !isDirty} className='h-12 w-full rounded-full'>
        {isSaving ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            {t('discountCodeSheet.saving')}
          </>
        ) : (
          tCommon('actions.saveChanges')
        )}
      </Button>
    </form>
  );
}
