'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useContacts } from '@/lib/hooks/use-contacts';
import { Loader2 } from '@/lib/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Lightning address validation schema
const addContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  lightningAddress: z
    .string()
    .min(1, 'Lightning address is required')
    .email('Lightning address must be in user@domain format'),
});

type AddContactFormData = z.infer<typeof addContactSchema>;

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactSheet({ open, onOpenChange }: AddContactSheetProps) {
  const { addContact, isAddingContact, findContactByAddress } = useContacts();

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
        message: 'A contact with this Lightning address already exists',
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
    <MasterScrollableSheet open={open} onOpenChange={handleOpenChange} title='Add Contact'>
      <div className='p-6'>
        <form id='add-contact-form' onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Name Input */}
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name
            </label>
            <Input
              {...register('name')}
              id='name'
              type='text'
              placeholder='Contact name'
              disabled={isAddingContact}
              autoComplete='name'
              className='h-12 rounded-full bg-gray-50'
            />
            {errors.name && <p className='text-sm text-destructive'>{errors.name.message}</p>}
          </div>

          {/* Lightning Address Input */}
          <div className='space-y-2'>
            <label htmlFor='lightningAddress' className='text-sm font-medium'>
              Lightning Address
            </label>
            <Input
              {...register('lightningAddress')}
              id='lightningAddress'
              type='email'
              placeholder='user@domain.com'
              disabled={isAddingContact}
              autoComplete='email'
              className='h-12 rounded-full bg-gray-50'
            />
            {errors.lightningAddress && (
              <p className='text-sm text-destructive'>{errors.lightningAddress.message}</p>
            )}
            <p className='text-xs text-muted-foreground'>
              Enter a Lightning address in user@domain format (e.g., alice@evento.cash)
            </p>
          </div>

          <Button
            type='submit'
            disabled={isAddingContact || !isValid}
            className='h-12 w-full rounded-full'
          >
            {isAddingContact ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Contact'
            )}
          </Button>
        </form>
      </div>
    </MasterScrollableSheet>
  );
}
