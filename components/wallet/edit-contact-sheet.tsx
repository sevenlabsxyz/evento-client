'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useContacts } from '@/lib/hooks/use-contacts';
import { Loader2 } from '@/lib/icons';
import type { Contact } from '@/lib/types/wallet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const editContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  lightningAddress: z
    .string()
    .min(1, 'Lightning address is required')
    .email('Lightning address must be in user@domain format'),
});

type EditContactFormData = z.infer<typeof editContactSchema>;

interface EditContactSheetProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactSheet({ contact, open, onOpenChange }: EditContactSheetProps) {
  const { updateContact, isUpdatingContact, findContactByAddress } = useContacts();

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
        message: 'A contact with this Lightning address already exists',
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
    <MasterScrollableSheet title='Edit Contact' open={open} onOpenChange={handleOpenChange}>
      <div className='p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name
            </label>
            <Input
              {...register('name')}
              id='name'
              placeholder='Contact name'
              disabled={isLoading}
              className='h-12 rounded-full bg-gray-50'
            />
            {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <label htmlFor='paymentIdentifier' className='text-sm font-medium'>
              Lightning Address
            </label>
            <Input
              {...register('lightningAddress')}
              id='paymentIdentifier'
              type='email'
              placeholder='user@domain.com'
              disabled={isLoading}
              autoComplete='email'
              className='h-12 rounded-full bg-gray-50'
            />
            {errors.lightningAddress && (
              <p className='text-sm text-red-500'>{errors.lightningAddress.message}</p>
            )}
            <p className='text-xs text-muted-foreground'>
              Enter a Lightning address in user@domain format
            </p>
          </div>

          <div className='space-y-3'>
            <Button
              type='submit'
              disabled={isLoading || !isDirty}
              className='h-12 w-full rounded-full'
            >
              {isUpdatingContact ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className='h-12 w-full rounded-full'
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
