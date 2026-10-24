'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useContacts } from '@/lib/hooks/use-contacts';
import type { Contact } from '@/lib/types/wallet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface EditContactSchemaMessages {
  nameRequired: string;
  nameTooLong: string;
  addressRequired: string;
  addressInvalid: string;
}

const createEditContactSchema = (m: EditContactSchemaMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).max(50, m.nameTooLong),
    lightningAddress: z.string().min(1, m.addressRequired).email(m.addressInvalid),
  });

interface EditContactFormData {
  name: string;
  lightningAddress: string;
}

interface EditContactSheetProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactSheet({ contact, open, onOpenChange }: EditContactSheetProps) {
  const t = useTranslations('walletFlows');
  const tCommon = useTranslations('common');
  const { updateContact, isUpdatingContact, findContactByAddress } = useContacts();
  const editContactSchema = useMemo(
    () =>
      createEditContactSchema({
        nameRequired: t('editContactSheet.errors.nameRequired'),
        nameTooLong: t('editContactSheet.errors.nameTooLong'),
        addressRequired: t('editContactSheet.errors.addressRequired'),
        addressInvalid: t('editContactSheet.errors.addressInvalid'),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      name: contact.name,
      lightningAddress: contact.paymentIdentifier,
    },
  });
  // Reset form when contact changes
  useEffect(() => {
    reset({ name: contact.name, lightningAddress: contact.paymentIdentifier });
  }, [contact, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({ name: contact.name, lightningAddress: contact.paymentIdentifier });
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: EditContactFormData) => {
    const existingContact = findContactByAddress(data.lightningAddress);
    if (existingContact && existingContact.id !== contact.id) {
      setError('lightningAddress', {
        type: 'manual',
        message: t('editContactSheet.errors.duplicate'),
      });
      return;
    }

    updateContact(
      {
        id: contact.id,
        name: data.name,
        paymentIdentifier: data.lightningAddress,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isLoading = isUpdatingContact;

  return (
    <MasterScrollableSheet
      title={t('editContactSheet.title')}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className='p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              {t('editContactSheet.nameLabel')}
            </label>
            <Input
              {...register('name')}
              id='name'
              placeholder={t('editContactSheet.namePlaceholder')}
              disabled={isLoading}
              className='h-12 rounded-full bg-gray-50 dark:bg-neutral-950'
            />
            {errors.name && (
              <p className='text-sm text-red-500 dark:text-red-400'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <label htmlFor='paymentIdentifier' className='text-sm font-medium'>
              {t('editContactSheet.addressLabel')}
            </label>
            <Input
              {...register('lightningAddress')}
              id='paymentIdentifier'
              type='email'
              placeholder='user@domain.com'
              disabled={isLoading}
              autoComplete='email'
              className='h-12 rounded-full bg-gray-50 dark:bg-neutral-950'
            />
            {errors.lightningAddress && (
              <p className='text-sm text-red-500 dark:text-red-400'>
                {errors.lightningAddress.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>{t('editContactSheet.addressHint')}</p>
          </div>

          <div className='space-y-3'>
            <Button
              type='submit'
              disabled={isLoading || !isDirty}
              className='h-12 w-full rounded-full'
            >
              {isUpdatingContact ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('editContactSheet.saving')}
                </>
              ) : (
                t('editContactSheet.submit')
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className='h-12 w-full rounded-full'
            >
              {tCommon('actions.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
