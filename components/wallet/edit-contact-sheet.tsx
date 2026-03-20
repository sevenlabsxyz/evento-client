'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useContacts } from '@/lib/hooks/use-contacts';
import type { Contact } from '@/lib/types/wallet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const editContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
});

type EditContactFormData = z.infer<typeof editContactSchema>;

interface EditContactSheetProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactSheet({ contact, open, onOpenChange }: EditContactSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateContact, deleteContact, isUpdatingContact, isDeletingContact } = useContacts();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      name: contact.name,
    },
  });

  // Reset form when contact changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({ name: contact.name });
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: EditContactFormData) => {
    updateContact(
      {
        id: contact.id,
        name: data.name,
        paymentIdentifier: contact.paymentIdentifier,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteContact(contact.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
      },
    });
  };

  const isLoading = isUpdatingContact || isDeletingContact;

  return (
    <>
      <MasterScrollableSheet
        title='Edit Contact'
        open={open}
        onOpenChange={handleOpenChange}
        footer={
          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading || !isDirty}
              className='h-12 w-full rounded-full'
            >
              {isUpdatingContact ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant='ghost'
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className='h-12 w-full rounded-full text-red-600 hover:bg-red-50 hover:text-red-700'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Contact
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 p-4'>
          {/* Name Field */}
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Name
            </label>
            <Input
              {...register('name')}
              id='name'
              placeholder='Contact name'
              disabled={isLoading}
              className='bg-gray-50'
            />
            {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
          </div>

          {/* Lightning Address (Read-only) */}
          <div className='space-y-2'>
            <label htmlFor='paymentIdentifier' className='text-sm font-medium'>
              Lightning Address
            </label>
            <Input
              id='paymentIdentifier'
              value={contact.paymentIdentifier}
              disabled
              className='bg-gray-100 text-muted-foreground'
            />
            <p className='text-xs text-muted-foreground'>Lightning address cannot be changed</p>
          </div>
        </form>
      </MasterScrollableSheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete `{contact.name}`? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingContact}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingContact}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeletingContact ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
