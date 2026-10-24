'use client';

import { DiscountCodesSection } from '@/components/manage-dashboard/tickets/discount-codes-section';
import { TicketTypeList } from '@/components/manage-dashboard/tickets/ticket-type-list';
import { TicketTypeSheet } from '@/components/manage-dashboard/tickets/ticket-type-sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { useTicketTypes } from '@/lib/hooks/use-ticket-types';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { TicketType } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { AlertTriangle, Plus, Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventTicketsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useEventDashboard(eventId);
  const {
    data: ticketTypes,
    isLoading: isTicketTypesLoading,
    error: ticketTypesError,
    refetch: refetchTicketTypes,
  } = useTicketTypes(eventId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('ticketsPage.title'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
      textButtons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute, t]);

  const openCreateSheet = () => {
    setEditingTicketType(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (ticketType: TicketType) => {
    setEditingTicketType(ticketType);
    setIsSheetOpen(true);
  };

  if (isDashboardLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <Skeleton className='h-24 w-full rounded-2xl' />
        <Skeleton className='h-40 w-full rounded-2xl' />
        <Skeleton className='h-32 w-full rounded-2xl' />
      </div>
    );
  }

  // The manage layout redirects non-hosts and renders the not-found state.
  if (dashboardError?.status === 403 || dashboardError?.status === 404) {
    return null;
  }

  if (dashboardError || !dashboard) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {t('ticketsPage.unavailableTitle')}
          </h2>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            {getErrorMessage(dashboardError) || t('ticketsPage.loadEventError')}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void refetchDashboard()}
            className='mt-4 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
          >
            {tCommon('actions.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (dashboard.event.type !== 'ticketed') {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-neutral-800'>
            <Ticket className='h-6 w-6 text-gray-500 dark:text-neutral-400' />
          </div>
          <h2 className='mt-4 text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {t('ticketsPage.notTicketedTitle')}
          </h2>
          <p className='mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>
            {dashboard.event.type === 'registration'
              ? t('ticketsPage.notTicketedRegistration')
              : t('ticketsPage.notTicketedRsvp')}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => router.push(`/e/${eventId}/manage`)}
            className='mt-6 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
          >
            {t('ticketsPage.backToOverview')}
          </Button>
        </div>
      </div>
    );
  }

  const allTicketTypes = ticketTypes ?? [];
  const activeTicketTypes = allTicketTypes.filter((ticketType) => ticketType.is_active);
  const totalSold = activeTicketTypes.reduce(
    (sum, ticketType) => sum + ticketType.quantity_sold,
    0
  );
  const totalCapacity = activeTicketTypes.reduce(
    (sum, ticketType) => sum + ticketType.quantity_total,
    0
  );
  const nextSortOrder =
    allTicketTypes.reduce((max, ticketType) => Math.max(max, ticketType.sort_order), -1) + 1;
  const showPublishRequirement =
    dashboard.event.status === 'draft' && !isTicketTypesLoading && activeTicketTypes.length === 0;

  return (
    <div className='space-y-6 py-4 md:py-6'>
      {showPublishRequirement ? (
        <div
          role='status'
          className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40'
        >
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400' />
          <div>
            <p className='text-sm font-semibold text-amber-900 dark:text-amber-200'>
              {t('ticketsPage.publishRequirementTitle')}
            </p>
            <p className='mt-0.5 text-sm text-amber-800 dark:text-amber-300'>
              {t('ticketsPage.publishRequirementDescription')}
            </p>
          </div>
        </div>
      ) : null}

      <section className='space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
              {t('ticketsPage.ticketTypesHeading')}
            </h2>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {activeTicketTypes.length > 0
                ? t('ticketsPage.ticketTypesSummary', {
                    active: activeTicketTypes.length,
                    sold: totalSold,
                    capacity: totalCapacity,
                  })
                : t('ticketsPage.ticketTypesSubtitle')}
            </p>
          </div>
          <Button type='button' size='sm' onClick={openCreateSheet} className='shrink-0'>
            <Plus />
            {t('ticketsPage.addTicketType')}
          </Button>
        </div>

        {isTicketTypesLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-36 w-full rounded-2xl' />
            <Skeleton className='h-36 w-full rounded-2xl' />
          </div>
        ) : ticketTypesError ? (
          <div className='rounded-2xl border border-gray-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900'>
            <p className='text-sm text-gray-600 dark:text-neutral-400'>
              {getErrorMessage(ticketTypesError) || t('ticketsPage.loadTicketTypesError')}
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => void refetchTicketTypes()}
              className='mt-3 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
            >
              {tCommon('actions.tryAgain')}
            </Button>
          </div>
        ) : allTicketTypes.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900'>
            <Ticket className='mx-auto h-6 w-6 text-gray-400 dark:text-neutral-500' />
            <p className='mt-2 text-sm font-medium text-gray-900 dark:text-neutral-100'>
              {t('ticketsPage.emptyTitle')}
            </p>
            <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
              {t('ticketsPage.emptyDescription')}
            </p>
          </div>
        ) : (
          <TicketTypeList eventId={eventId} ticketTypes={allTicketTypes} onEdit={openEditSheet} />
        )}
      </section>

      <DiscountCodesSection eventId={eventId} />

      <TicketTypeSheet
        eventId={eventId}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        ticketType={editingTicketType}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
