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
import { useDeleteList } from '@/lib/hooks/use-delete-list';
import { UserList } from '@/lib/types/api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { formatEventCount } from './list-utils';

interface DeleteListDialogProps {
  list: UserList | null;
  /** Known number of saved events in the list, if loaded. */
  eventCount?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs before the request, so a page showing this list can stop observing it. */
  onDeleteStart?: () => void;
  /** Runs once the request settles; `deleted` is false when it failed. */
  onDeleteSettled?: (deleted: boolean) => void;
}

export function DeleteListDialog({
  list,
  eventCount,
  open,
  onOpenChange,
  onDeleteStart,
  onDeleteSettled,
}: DeleteListDialogProps) {
  const deleteList = useDeleteList();

  const handleDelete = async () => {
    if (!list) return;
    onDeleteStart?.();
    try {
      await deleteList.mutateAsync(list.id);
      toast.success(`"${list.name}" was deleted.`, 'List deleted');
      onOpenChange(false);
      onDeleteSettled?.(true);
    } catch (error) {
      toast.error(getErrorMessage(error), 'Couldn’t delete list');
      onDeleteSettled?.(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleteList.isPending) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className='max-w-md rounded-2xl sm:rounded-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-gray-900 dark:text-neutral-100'>
            Delete “{list?.name}”?
          </AlertDialogTitle>
          <AlertDialogDescription className='text-gray-600 dark:text-neutral-400'>
            {eventCount && eventCount > 0
              ? `This removes the list along with the ${formatEventCount(eventCount)} saved in it.`
              : 'This removes the list.'}{' '}
            The events themselves aren’t affected. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='gap-2 sm:space-x-0'>
          <AlertDialogCancel
            disabled={deleteList.isPending}
            className='mt-0 rounded-full dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(clickEvent) => {
              // Keep the dialog open until the request settles.
              clickEvent.preventDefault();
              void handleDelete();
            }}
            disabled={deleteList.isPending}
            className='rounded-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {deleteList.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
                Deleting…
              </>
            ) : (
              'Delete list'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
