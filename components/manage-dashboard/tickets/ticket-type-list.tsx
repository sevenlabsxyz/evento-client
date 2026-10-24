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
import { useDeleteTicketType } from '@/lib/hooks/use-ticket-types';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import type { TicketCurrency, TicketType } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { Lock, Pencil, Ticket, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

export function formatTicketPrice(
  amount: number,
  currency: TicketCurrency,
  freeLabel: string,
  locale: string
): string {
  const value = Number(amount);
  if (value === 0) {
    return freeLabel;
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface TicketTypeListProps {
  eventId: string;
  ticketTypes: TicketType[];
  onEdit: (ticketType: TicketType) => void;
}

export function TicketTypeList({ eventId, ticketTypes, onEdit }: TicketTypeListProps) {
  const t = useTranslations('manage');
  const deleteTicketType = useDeleteTicketType(eventId);
  const [pendingDeactivation, setPendingDeactivation] = useState<TicketType | null>(null);

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivation) {
      return;
    }

    try {
      await deleteTicketType.mutateAsync(pendingDeactivation.id);
      toast.success(t('ticketTypeList.deactivatedToast', { name: pendingDeactivation.name }));
      setPendingDeactivation(null);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('ticketTypeList.deactivateError'));
    }
  };

  return (
    <>
      <ul className='divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900'>
        {ticketTypes.map((ticketType) => (
          <TicketTypeRow
            key={ticketType.id}
            ticketType={ticketType}
            onEdit={() => onEdit(ticketType)}
            onDeactivate={() => setPendingDeactivation(ticketType)}
          />
        ))}
      </ul>

      <AlertDialog
        open={pendingDeactivation !== null}
        onOpenChange={(open) => {
          if (!open && !deleteTicketType.isPending) {
            setPendingDeactivation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ticketTypeList.deactivateDialogTitle', { name: pendingDeactivation?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription className='dark:text-neutral-400'>
              {t('ticketTypeList.deactivateDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTicketType.isPending}>
              {t('ticketTypeList.keep')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDeactivate();
              }}
              disabled={deleteTicketType.isPending}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:text-white'
            >
              {deleteTicketType.isPending
                ? t('ticketTypeList.deactivating')
                : t('ticketTypeList.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface TicketTypeRowProps {
  ticketType: TicketType;
  onEdit: () => void;
  onDeactivate: () => void;
}

function TicketTypeRow({ ticketType, onEdit, onDeactivate }: TicketTypeRowProps) {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const sold = ticketType.quantity_sold;
  const total = ticketType.quantity_total;
  const available = ticketType.quantity_available ?? Math.max(total - sold, 0);
  const isSoldOut = ticketType.is_sold_out ?? sold >= total;
  const hasSales = sold > 0;
  const percentSold = total > 0 ? Math.min(Math.round((sold / total) * 100), 100) : 0;

  return (
    <li className='space-y-3 p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800'>
          <Ticket className='h-5 w-5 text-gray-600 dark:text-neutral-300' />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='truncate text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {ticketType.name}
            </h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                ticketType.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
              )}
            >
              {ticketType.is_active ? t('ticketTypeList.active') : t('ticketTypeList.inactive')}
            </span>
            {isSoldOut ? (
              <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-400'>
                {t('ticketTypeList.soldOut')}
              </span>
            ) : null}
          </div>
          {ticketType.description ? (
            <p className='mt-1 line-clamp-2 text-sm text-gray-500 dark:text-neutral-400'>
              {ticketType.description}
            </p>
          ) : null}
        </div>
        <div className='shrink-0 text-right'>
          <p className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {formatTicketPrice(
              ticketType.price_amount,
              ticketType.price_currency,
              tCommon('labels.free'),
              locale
            )}
          </p>
          {Number(ticketType.price_amount) > 0 ? (
            <p className='text-xs text-gray-500 dark:text-neutral-400'>
              {ticketType.price_currency}
            </p>
          ) : null}
        </div>
      </div>

      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400'>
          <span>
            {t.rich('ticketTypeList.soldCount', {
              sold,
              total,
              strong: (chunks) => (
                <span className='font-medium text-gray-900 dark:text-neutral-100'>{chunks}</span>
              ),
            })}
          </span>
          <span>
            {isSoldOut
              ? t('ticketTypeList.noneLeft')
              : t('ticketTypeList.available', { count: available })}
          </span>
        </div>
        <div
          role='progressbar'
          aria-label={t('ticketTypeList.progressAria', { name: ticketType.name })}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={sold}
          className='h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800'
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isSoldOut ? 'bg-red-500 dark:bg-red-400' : 'bg-gray-900 dark:bg-neutral-100'
            )}
            style={{ width: `${percentSold}%` }}
          />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onEdit}
          disabled={hasSales}
          className='dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
        >
          <Pencil />
          {tCommon('actions.edit')}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onDeactivate}
          disabled={hasSales || !ticketType.is_active}
          className='text-red-600 hover:text-red-700 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-neutral-800 dark:hover:text-red-300'
        >
          <Trash2 />
          {t('ticketTypeList.deactivate')}
        </Button>
        {hasSales ? (
          <span className='flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400'>
            <Lock className='h-3 w-3' />
            {t('ticketTypeList.lockedNotice')}
          </span>
        ) : null}
      </div>
    </li>
  );
}
