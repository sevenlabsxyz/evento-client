'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCreateList } from '@/lib/hooks/use-create-list';
import { useUpdateList } from '@/lib/hooks/use-update-list';
import { UserList } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormEvent, useEffect, useId, useState } from 'react';
import { LIST_DESCRIPTION_MAX_LENGTH, LIST_NAME_MAX_LENGTH, validateListName } from './list-utils';

interface ListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All of the user's lists, for duplicate-name validation. */
  lists: UserList[];
  /** The list to rename; omit to create a new list. */
  list?: UserList | null;
  onCreated?: (list: UserList) => void;
}

/** Create or rename a list: dialog on desktop, bottom sheet on mobile. */
export function ListFormDialog({
  open,
  onOpenChange,
  lists,
  list,
  onCreated,
}: ListFormDialogProps) {
  const t = useTranslations('lists');
  const tCommon = useTranslations('common');
  const isMobile = useIsMobile();
  const formId = useId();
  const nameId = `${formId}-name`;
  const nameErrorId = `${formId}-name-error`;
  const descriptionId = `${formId}-description`;
  const isRename = Boolean(list);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const createList = useCreateList();
  const updateList = useUpdateList();
  const isPending = createList.isPending || updateList.isPending;

  // Reset only when the dialog opens or targets another list; a background refetch
  // hands us a new `list` object and must not wipe what the user is typing.
  useEffect(() => {
    if (!open) return;
    setName(list?.name ?? '');
    setDescription(list?.description ?? '');
    setShowValidation(false);
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list?.id]);

  const validationError = validateListName(name, lists, list?.id);
  const validationMessage = validationError
    ? t(`nameErrors.${validationError}`, { max: LIST_NAME_MAX_LENGTH })
    : null;
  const visibleError = serverError ?? (showValidation ? validationMessage : null);
  const title = isRename ? t('form.renameTitle') : t('form.newTitle');
  const subtitle = isRename ? t('form.renameSubtitle') : t('form.newSubtitle');

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    setShowValidation(true);
    if (validationError || isPending) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    setServerError(null);

    try {
      if (list) {
        const changes: { name?: string; description?: string } = {};
        if (trimmedName !== list.name) changes.name = trimmedName;
        if (trimmedDescription !== (list.description ?? '')) {
          changes.description = trimmedDescription;
        }
        if (Object.keys(changes).length > 0) {
          await updateList.mutateAsync({ listId: list.id, data: changes });
          toast.success(t('form.savedMessage'), t('form.savedTitle'));
        }
      } else {
        const created = await createList.mutateAsync({
          name: trimmedName,
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        });
        toast.success(t('form.createdMessage', { name: created.name }), t('form.createdTitle'));
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  const submitLabel = isRename ? tCommon('actions.saveChanges') : t('form.createList');
  const pendingLabel = isRename ? tCommon('states.saving') : t('form.creating');

  const fields = (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <div className='flex items-baseline justify-between'>
          <Label htmlFor={nameId} className='text-gray-900 dark:text-neutral-100'>
            {tCommon('labels.name')}
          </Label>
          <span className='text-xs tabular-nums text-gray-500 dark:text-neutral-500'>
            {name.trim().length}/{LIST_NAME_MAX_LENGTH}
          </span>
        </div>
        <Input
          id={nameId}
          value={name}
          onChange={(changeEvent) => {
            setName(changeEvent.target.value);
            setServerError(null);
          }}
          placeholder={t('form.namePlaceholder')}
          maxLength={LIST_NAME_MAX_LENGTH}
          autoFocus={!isMobile}
          autoComplete='off'
          aria-invalid={Boolean(visibleError)}
          aria-describedby={visibleError ? nameErrorId : undefined}
          className={cn(
            'h-11 rounded-xl bg-white dark:bg-neutral-900',
            visibleError && 'border-red-500 focus-visible:ring-red-500 dark:border-red-500'
          )}
        />
        {visibleError && (
          <p id={nameErrorId} role='alert' className='text-sm text-red-600 dark:text-red-400'>
            {visibleError}
          </p>
        )}
      </div>
      <div className='space-y-2'>
        <div className='flex items-baseline justify-between'>
          <Label htmlFor={descriptionId} className='text-gray-900 dark:text-neutral-100'>
            {t('form.description')}{' '}
            <span className='font-normal text-gray-500 dark:text-neutral-500'>
              {t('form.optional')}
            </span>
          </Label>
          <span className='text-xs tabular-nums text-gray-500 dark:text-neutral-500'>
            {description.length}/{LIST_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          maxLength={LIST_DESCRIPTION_MAX_LENGTH}
          rows={3}
          className='resize-none rounded-xl bg-white dark:bg-neutral-900'
        />
      </div>
    </div>
  );

  const submitButton = (
    <Button type='submit' form={formId} disabled={isPending} className='flex-1 sm:flex-none'>
      {isPending ? (
        <>
          <Loader2 className='animate-spin' aria-hidden='true' />
          {pendingLabel}
        </>
      ) : (
        submitLabel
      )}
    </Button>
  );

  const cancelButton = (
    <Button
      type='button'
      variant='outline'
      onClick={() => handleOpenChange(false)}
      disabled={isPending}
      className='flex-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 sm:flex-none'
    >
      {tCommon('actions.cancel')}
    </Button>
  );

  if (isMobile) {
    return (
      <MasterScrollableSheet
        title={title}
        open={open}
        onOpenChange={handleOpenChange}
        headerSecondary={
          <p className='px-4 pb-3 text-sm text-gray-500 dark:text-neutral-400'>{subtitle}</p>
        }
        contentClassName='p-4'
        footer={
          <div className='flex gap-3'>
            {cancelButton}
            {submitButton}
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} noValidate>
          {fields}
        </form>
      </MasterScrollableSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-md gap-6 rounded-2xl sm:rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl text-gray-900 dark:text-neutral-100'>{title}</DialogTitle>
          <DialogDescription className='text-gray-600 dark:text-neutral-400'>
            {subtitle}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} noValidate>
          {fields}
        </form>
        <DialogFooter className='gap-2 sm:space-x-0'>
          {cancelButton}
          {submitButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
