'use client';

import { ListLoadError } from '@/components/lists/list-load-error';
import {
  LIST_NAME_MAX_LENGTH,
  isDefaultList,
  orderLists,
  validateListName,
} from '@/components/lists/list-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddEventToList } from '@/lib/hooks/use-add-event-to-list';
import { useCreateList } from '@/lib/hooks/use-create-list';
import { useEnsureDefaultList } from '@/lib/hooks/use-ensure-default-list';
import { useEventSavedStatus } from '@/lib/hooks/use-event-saved-status';
import { useRemoveEventFromList } from '@/lib/hooks/use-remove-event-from-list';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { UserList } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { ArrowRight, Check, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

interface SaveEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export default function SaveEventSheet({ isOpen, onClose, eventId }: SaveEventSheetProps) {
  const t = useTranslations('event');
  const tLists = useTranslations('lists');
  const tCommon = useTranslations('common');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingListIds, setPendingListIds] = useState<ReadonlySet<string>>(new Set());

  // Nothing is fetched (or created) until the sheet is actually opened.
  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useUserLists(isOpen);
  const {
    data: savedStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useEventSavedStatus(eventId, isOpen);
  const { isCreatingDefaultList } = useEnsureDefaultList(isOpen);
  const addToListMutation = useAddEventToList();
  const removeFromListMutation = useRemoveEventFromList();
  const createListMutation = useCreateList();

  const orderedLists = useMemo(() => orderLists(lists ?? []), [lists]);
  const savedListIds = useMemo(
    () => new Set(savedStatus?.saved_in_lists.map((entry) => entry.list_id) ?? []),
    [savedStatus]
  );

  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setNewListName('');
      setShowValidation(false);
      setCreateError(null);
    }
  }, [isOpen]);

  const setListPending = (listId: string, pending: boolean) => {
    setPendingListIds((current) => {
      const next = new Set(current);
      if (pending) next.add(listId);
      else next.delete(listId);
      return next;
    });
  };

  const handleToggleList = async (list: UserList) => {
    const isSaved = savedListIds.has(list.id);
    setListPending(list.id, true);
    try {
      // Checkbox state flips optimistically inside the mutation hooks.
      if (isSaved) {
        await removeFromListMutation.mutateAsync({ listId: list.id, eventId });
        toast.success(t('saveSheet.removedFrom', { list: list.name }), t('saveSheet.removedTitle'));
      } else {
        await addToListMutation.mutateAsync({ listId: list.id, eventId });
        toast.success(t('saveSheet.savedTo', { list: list.name }), tCommon('toasts.saved'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error), t('saveSheet.updateFailedTitle'));
    } finally {
      setListPending(list.id, false);
    }
  };

  const nameError = validateListName(newListName, orderedLists);
  const visibleNameError =
    createError ??
    (showValidation && nameError
      ? tLists(`nameErrors.${nameError}`, { max: LIST_NAME_MAX_LENGTH })
      : null);
  const isCreating = createListMutation.isPending;

  const handleCreateList = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    setShowValidation(true);
    if (nameError || isCreating) return;

    const trimmedName = newListName.trim();
    setCreateError(null);

    let createdList: UserList;
    try {
      createdList = await createListMutation.mutateAsync({ name: trimmedName });
    } catch (error) {
      setCreateError(getErrorMessage(error));
      return;
    }

    setNewListName('');
    setShowValidation(false);
    setShowCreateForm(false);

    setListPending(createdList.id, true);
    try {
      await addToListMutation.mutateAsync({ listId: createdList.id, eventId });
      toast.success(
        t('saveSheet.createdAndSaved', { list: createdList.name }),
        tCommon('toasts.saved')
      );
    } catch (error) {
      toast.error(
        t('saveSheet.createdNotAdded', { list: createdList.name, error: getErrorMessage(error) }),
        t('saveSheet.saveFailedTitle')
      );
    } finally {
      setListPending(createdList.id, false);
    }
  };

  const isLoading =
    listsLoading || statusLoading || (orderedLists.length === 0 && isCreatingDefaultList);
  const loadError = listsError ?? statusError;

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-16 w-full rounded-2xl' />
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <ListLoadError
          title={t('saveSheet.loadFailed')}
          message={getErrorMessage(loadError)}
          onRetry={() => {
            if (listsError) void refetchLists();
            if (statusError) void refetchStatus();
          }}
        />
      );
    }

    return (
      <div className='space-y-4'>
        {showCreateForm ? (
          <form
            onSubmit={handleCreateList}
            noValidate
            className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
          >
            <div className='mb-2 flex items-baseline justify-between'>
              <label
                htmlFor='save-sheet-new-list'
                className='text-sm font-medium text-gray-900 dark:text-neutral-100'
              >
                {t('saveSheet.newList')}
              </label>
              <span className='text-xs tabular-nums text-gray-500 dark:text-neutral-500'>
                {newListName.trim().length}/{LIST_NAME_MAX_LENGTH}
              </span>
            </div>
            <Input
              id='save-sheet-new-list'
              type='text'
              value={newListName}
              onChange={(changeEvent) => {
                setNewListName(changeEvent.target.value);
                setCreateError(null);
              }}
              placeholder={t('saveSheet.namePlaceholder')}
              maxLength={LIST_NAME_MAX_LENGTH}
              autoComplete='off'
              autoFocus
              aria-invalid={Boolean(visibleNameError)}
              aria-describedby={visibleNameError ? 'save-sheet-new-list-error' : undefined}
              className={cn(
                'h-11 rounded-xl bg-white dark:bg-neutral-900',
                visibleNameError && 'border-red-500 focus-visible:ring-red-500 dark:border-red-500'
              )}
            />
            {visibleNameError && (
              <p
                id='save-sheet-new-list-error'
                role='alert'
                className='mt-2 text-sm text-red-600 dark:text-red-400'
              >
                {visibleNameError}
              </p>
            )}
            <div className='mt-3 flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowCreateForm(false);
                  setNewListName('');
                  setShowValidation(false);
                  setCreateError(null);
                }}
                disabled={isCreating}
                className='flex-1 dark:bg-neutral-900 dark:hover:bg-neutral-800'
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type='submit' disabled={isCreating} className='flex-1'>
                {isCreating ? (
                  <>
                    <Loader2 className='animate-spin' aria-hidden='true' />
                    {t('saveSheet.creating')}
                  </>
                ) : (
                  t('saveSheet.createAndSave')
                )}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type='button'
            onClick={() => setShowCreateForm(true)}
            className='flex w-full items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-4 text-left text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60'
          >
            <span className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
              <Plus className='h-4 w-4' aria-hidden='true' />
            </span>
            {t('saveSheet.newList')}
          </button>
        )}

        {orderedLists.length > 0 && (
          <ul className='space-y-2' aria-label={t('saveSheet.yourLists')}>
            {orderedLists.map((list) => {
              const checked = savedListIds.has(list.id);
              const isPending = pendingListIds.has(list.id);
              return (
                <li key={list.id}>
                  <button
                    type='button'
                    role='checkbox'
                    aria-checked={checked}
                    onClick={() => void handleToggleList(list)}
                    disabled={isPending}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait',
                      checked
                        ? 'border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                        checked
                          ? 'border-red-500 bg-red-500 dark:border-red-500 dark:bg-red-600'
                          : 'border-gray-300 bg-white dark:border-neutral-600 dark:bg-neutral-900'
                      )}
                    >
                      {isPending ? (
                        <Loader2
                          className={cn(
                            'h-3 w-3 animate-spin',
                            checked ? 'text-white' : 'text-gray-400 dark:text-neutral-500'
                          )}
                        />
                      ) : (
                        checked && <Check className='h-3 w-3 text-white' strokeWidth={3} />
                      )}
                    </span>
                    <span className='min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-neutral-100'>
                      {list.name}
                    </span>
                    {isDefaultList(list, orderedLists) && (
                      <span className='shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'>
                        {t('saveSheet.default')}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <MasterScrollableSheet
      title={t('saveSheet.title')}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerSecondary={
        <div className='flex items-center justify-between gap-3 px-4 pb-3'>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('saveSheet.description')}
          </p>
          <Link
            href='/e/lists'
            onClick={onClose}
            className='inline-flex shrink-0 items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
          >
            {t('saveSheet.yourLists')}
            <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
          </Link>
        </div>
      }
      contentClassName='p-4'
    >
      {renderBody()}
    </MasterScrollableSheet>
  );
}
