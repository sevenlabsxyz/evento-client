'use client';

import { DiscountCodeSheet } from '@/components/manage-dashboard/tickets/discount-code-sheet';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useDeleteDiscountCode,
  useDiscountCodes,
  useUpdateDiscountCode,
} from '@/lib/hooks/use-discount-codes';
import type { DiscountCode } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DiscountCodesSectionProps {
  eventId: string;
}

export function DiscountCodesSection({ eventId }: DiscountCodesSectionProps) {
  const { data: discountCodes, isLoading, error, refetch } = useDiscountCodes(eventId);
  const updateDiscountCode = useUpdateDiscountCode(eventId);
  const deleteDiscountCode = useDeleteDiscountCode(eventId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<DiscountCode | null>(null);

  const openCreateSheet = () => {
    setEditingCode(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (discountCode: DiscountCode) => {
    setEditingCode(discountCode);
    setIsSheetOpen(true);
  };

  const handleToggleActive = async (discountCode: DiscountCode, isActive: boolean) => {
    try {
      await updateDiscountCode.mutateAsync({ codeId: discountCode.id, is_active: isActive });
      toast.success(`${discountCode.code} ${isActive ? 'activated' : 'paused'}`);
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError) || 'Failed to update discount code');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeletion) {
      return;
    }

    try {
      await deleteDiscountCode.mutateAsync(pendingDeletion.id);
      toast.success(`${pendingDeletion.code} deleted`);
      setPendingDeletion(null);
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError) || 'Failed to delete discount code');
    }
  };

  const codes = discountCodes ?? [];

  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            Discount codes
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            Percentage discounts buyers apply at checkout.
          </p>
        </div>
        <Button type='button' size='sm' onClick={openCreateSheet} className='shrink-0'>
          <Plus />
          Add code
        </Button>
      </div>

      {isLoading ? (
        <div className='space-y-px overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className='flex items-center justify-between p-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-3 w-20' />
              </div>
              <Skeleton className='h-6 w-11 rounded-full' />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className='rounded-2xl border border-gray-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <p className='text-sm text-gray-600 dark:text-neutral-400'>
            {getErrorMessage(error) || 'Could not load discount codes.'}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void refetch()}
            className='mt-3 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
          >
            Try again
          </Button>
        </div>
      ) : codes.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <Percent className='mx-auto h-6 w-6 text-gray-400 dark:text-neutral-500' />
          <p className='mt-2 text-sm font-medium text-gray-900 dark:text-neutral-100'>
            No discount codes yet
          </p>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            Create a code to offer early-bird, community, or partner pricing.
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900'>
          {codes.map((discountCode) => {
            const isExhausted = discountCode.usage_count >= discountCode.usage_limit;
            const isToggling =
              updateDiscountCode.isPending &&
              updateDiscountCode.variables?.codeId === discountCode.id &&
              updateDiscountCode.variables.is_active !== undefined;

            return (
              <li key={discountCode.id} className='flex items-center gap-3 p-4'>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={cn(
                        'truncate font-mono text-sm font-semibold tracking-wide',
                        discountCode.is_active
                          ? 'text-gray-900 dark:text-neutral-100'
                          : 'text-gray-400 line-through dark:text-neutral-500'
                      )}
                    >
                      {discountCode.code}
                    </span>
                    <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400'>
                      {discountCode.percentage}% off
                    </span>
                    {isExhausted ? (
                      <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'>
                        Limit reached
                      </span>
                    ) : null}
                  </div>
                  <p className='mt-1 text-xs text-gray-500 dark:text-neutral-400'>
                    {discountCode.usage_count} / {discountCode.usage_limit} used
                    {discountCode.is_active ? '' : ' · Paused'}
                  </p>
                </div>

                <div className='flex shrink-0 items-center gap-1'>
                  <Switch
                    checked={discountCode.is_active}
                    disabled={isToggling}
                    onCheckedChange={(checked) => void handleToggleActive(discountCode, checked)}
                    aria-label={`${discountCode.is_active ? 'Pause' : 'Activate'} ${discountCode.code}`}
                  />
                  <button
                    type='button'
                    onClick={() => openEditSheet(discountCode)}
                    aria-label={`Edit ${discountCode.code} usage limit`}
                    className='ml-1 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                  >
                    <Pencil className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => setPendingDeletion(discountCode)}
                    aria-label={`Delete ${discountCode.code}`}
                    className='rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DiscountCodeSheet
        eventId={eventId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        discountCode={editingCode}
      />

      <AlertDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open && !deleteDiscountCode.isPending) {
            setPendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDeletion?.code}?</AlertDialogTitle>
            <AlertDialogDescription className='dark:text-neutral-400'>
              Buyers will no longer be able to use this code. This can&apos;t be undone
              {pendingDeletion && pendingDeletion.usage_count > 0
                ? ' — to stop new redemptions while keeping its history, pause it instead.'
                : '.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDiscountCode.isPending}>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
              disabled={deleteDiscountCode.isPending}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:text-white'
            >
              {deleteDiscountCode.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
