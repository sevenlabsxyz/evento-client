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
import type { Contact } from '@/lib/types/wallet';
import { cn } from '@/lib/utils';
import { ChevronRight, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('walletFlows');
  const tCommon = useTranslations('common');
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
      <MasterScrollableSheet
        title={t('contactActionsSheet.title')}
        open={open}
        onOpenChange={onOpenChange}
      >
        <div className='px-4 pb-6'>
          <button
            type='button'
            onClick={canOpenProfile ? handleOpenProfile : undefined}
            disabled={!canOpenProfile}
            className={cn(
              'mb-5 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-neutral-800 dark:bg-neutral-950',
              canOpenProfile
                ? 'transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                : 'cursor-default'
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
              <p className='truncate text-base font-semibold text-gray-900 dark:text-neutral-100'>
                {displayName}
              </p>
              {displayUsername ? (
                <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                  {displayUsername}
                </p>
              ) : null}
              <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                {contact.paymentIdentifier}
              </p>
            </div>
            {canOpenProfile ? (
              <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400 dark:text-neutral-500' />
            ) : null}
          </button>

          <div className='space-y-3'>
            <Button
              type='button'
              variant='outline'
              className='h-14 w-full justify-start text-base font-medium'
              onClick={handleEdit}
            >
              <Pencil className='mr-3 h-4 w-4' />
              {t('contactActionsSheet.edit')}
            </Button>

            <Button
              type='button'
              variant='outline'
              className='h-14 w-full justify-start text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-400'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='mr-3 h-4 w-4' />
              {t('contactActionsSheet.remove')}
            </Button>

            <Button
              type='button'
              variant='outline'
              className='mt-2 h-14 w-full text-base font-medium text-gray-600 dark:text-neutral-400'
              onClick={() => onOpenChange(false)}
            >
              {tCommon('actions.cancel')}
            </Button>
          </div>
        </div>
      </MasterScrollableSheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contactActionsSheet.remove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contactActionsSheet.removeConfirm', { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingContact}>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingContact}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeletingContact ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('contactActionsSheet.removing')}
                </>
              ) : (
                t('contactActionsSheet.remove')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
