'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useContacts } from '@/lib/hooks/use-contacts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface AddContactSchemaMessages {
  nameRequired: string;
  nameTooLong: string;
  addressRequired: string;
  addressInvalid: string;
}

// Lightning address validation schema
const createAddContactSchema = (m: AddContactSchemaMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).max(50, m.nameTooLong),
    lightningAddress: z.string().min(1, m.addressRequired).email(m.addressInvalid),
  });

interface AddContactFormData {
  name: string;
  lightningAddress: string;
}

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactSheet({ open, onOpenChange }: AddContactSheetProps) {
  const t = useTranslations('walletFlows');
  const { addContact, isAddingContact, findContactByAddress } = useContacts();
  const addContactSchema = useMemo(
    () =>
      createAddContactSchema({
        nameRequired: t('addContactSheet.errors.nameRequired'),
        nameTooLong: t('addContactSheet.errors.nameTooLong'),
        addressRequired: t('addContactSheet.errors.addressRequired'),
        addressInvalid: t('addContactSheet.errors.addressInvalid'),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      lightningAddress: '',
    },
  });

  const onSubmit = async (data: AddContactFormData) => {
    // Check for duplicate before submitting
    const existingContact = findContactByAddress(data.lightningAddress);
    if (existingContact) {
      setError('lightningAddress', {
        type: 'manual',
        message: t('addContactSheet.errors.duplicate'),
      });
      return;
    }

    addContact(
      {
        name: data.name,
        paymentIdentifier: data.lightningAddress,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <MasterScrollableSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t('addContactSheet.title')}
    >
      <div className='p-6'>
        <form id='add-contact-form' onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Name Input */}
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              {t('addContactSheet.nameLabel')}
            </label>
            <Input
              {...register('name')}
              id='name'
              type='text'
              placeholder={t('addContactSheet.namePlaceholder')}
              disabled={isAddingContact}
              autoComplete='name'
              className='h-12 rounded-full bg-gray-50 dark:bg-neutral-950'
            />
            {errors.name && (
              <p className='text-sm text-destructive dark:text-red-400'>{errors.name.message}</p>
            )}
          </div>

          {/* Lightning Address Input */}
          <div className='space-y-2'>
            <label htmlFor='lightningAddress' className='text-sm font-medium'>
              {t('addContactSheet.addressLabel')}
            </label>
            <Input
              {...register('lightningAddress')}
              id='lightningAddress'
              type='email'
              placeholder='user@domain.com'
              disabled={isAddingContact}
              autoComplete='email'
              className='h-12 rounded-full bg-gray-50 dark:bg-neutral-950'
            />
            {errors.lightningAddress && (
              <p className='text-sm text-destructive dark:text-red-400'>
                {errors.lightningAddress.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>{t('addContactSheet.addressHint')}</p>
          </div>

          <Button
            type='submit'
            disabled={isAddingContact || !isValid}
            className='h-12 w-full rounded-full'
          >
            {isAddingContact ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('addContactSheet.saving')}
              </>
            ) : (
              t('addContactSheet.submit')
            )}
          </Button>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
