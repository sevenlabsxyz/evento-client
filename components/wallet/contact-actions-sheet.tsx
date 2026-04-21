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
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useContacts } from '@/lib/hooks/use-contacts';
import { useEventoCashProfile } from '@/lib/hooks/use-evento-cash-profile';
import { ChevronRight, Loader2, Pencil, Trash2 } from '@/lib/icons';
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContactActionsSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (contact: Contact) => void;
}

export function ContactActionsSheet({
  contact,
  open,
  onOpenChange,
  onEdit,
}: ContactActionsSheetProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteContact, isDeletingContact } = useContacts();
  const paymentIdentifier = contact?.paymentIdentifier;
  const isEventoCashAddress = paymentIdentifier?.endsWith('@evento.cash') ?? false;
  const { data: profile } = useEventoCashProfile(
    isEventoCashAddress ? paymentIdentifier : undefined
  );

  if (!contact) {
    return null;
  }

  const canOpenProfile = isEventoCashAddress && !!profile?.username;
  const displayName = isEventoCashAddress ? profile?.displayName || contact.name : contact.name;
  const displayUsername = canOpenProfile ? `@${profile.username}` : null;
  const avatarSrc = canOpenProfile ? profile.avatar : undefined;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(contact);
  };

  const handleOpenProfile = () => {
    if (!profile?.username) {
      return;
    }

    onOpenChange(false);
    router.push(`/${profile.username}`);
  };

  const handleDelete = () => {
    deleteContact(contact.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <MasterScrollableSheet title='Contact Options' open={open} onOpenChange={onOpenChange}>
        <div className='px-4 pb-6'>
          <button
            type='button'
            onClick={canOpenProfile ? handleOpenProfile : undefined}
            disabled={!canOpenProfile}
            className={cn(
              'mb-5 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left',
              canOpenProfile ? 'transition-colors hover:bg-gray-100' : 'cursor-default'
            )}
          >
            <UserAvatar
              user={{
                name: displayName,
                image: avatarSrc,
              }}
              height={44}
              width={44}
              className='shrink-0'
            />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-base font-semibold text-gray-900'>{displayName}</p>
              {displayUsername ? (
                <p className='truncate text-sm text-gray-500'>{displayUsername}</p>
              ) : null}
              <p className='truncate text-sm text-gray-500'>{contact.paymentIdentifier}</p>
            </div>
            {canOpenProfile ? (
              <ChevronRight className='h-5 w-6 flex-shrink-0 text-gray-400' />
            ) : null}
          </button>

          <div className='space-y-3'>
            <Button
              type='button'
              variant='outline'
              className='h-14 w-full justify-start text-base font-medium'
              onClick={handleEdit}
            >
              <Pencil className='mr-3 h-5 w-4' />
              Edit Contact
            </Button>

            <Button
              type='button'
              variant='outline'
              className='h-14 w-full justify-start text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='mr-3 h-5 w-4' />
              Remove Wallet Contact
            </Button>

            <Button
              type='button'
              variant='outline'
              className='mt-2 h-14 w-full text-base font-medium text-gray-600'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </MasterScrollableSheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Wallet Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove `{displayName}` from your wallet contacts? This action
              cannot be undone.
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
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Removing...
                </>
              ) : (
                'Remove Wallet Contact'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
