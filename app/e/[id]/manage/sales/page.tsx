'use client';

import { SalesChart, SalesChartSkeleton } from '@/components/manage-dashboard/sales/sales-chart';
import {
  SalesSummary,
  SalesSummarySkeleton,
} from '@/components/manage-dashboard/sales/sales-summary';
import {
  TicketTypeBreakdown,
  TicketTypeBreakdownSkeleton,
} from '@/components/manage-dashboard/sales/ticket-type-breakdown';
import { Button } from '@/components/ui/button';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { downloadAttendeesCsv, useEventSales } from '@/lib/hooks/use-event-sales';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { EventDashboard } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, BarChart3, Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function EventSalesPage() {
  const t = useTranslations('manage');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const { data: dashboard, isLoading, error, refetch, isRefetching } = useEventDashboard(eventId);

  // `textButtons` is owned by <TicketedSales>, which only renders for ticketed events.
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('salesPage.title'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute, t]);

  if (isLoading) {
    return <SalesPageSkeleton />;
  }

  // The manage layout redirects non-hosts away; render nothing meanwhile.
  if (error?.status === 403) {
    return null;
  }

  if (error || !dashboard) {
    return (
      <div className='py-4 md:py-6'>
        <ErrorCard
          title={t('salesPage.unavailable')}
          message={error ? getErrorMessage(error) : t('salesPage.eventLoadError')}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  if (dashboard.event.type !== 'ticketed' || !dashboard.tickets) {
    return (
      <div className='py-4 md:py-6'>
        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
            <BarChart3 className='h-6 w-6 text-gray-500 dark:text-neutral-400' />
          </div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {t('salesPage.notTicketedTitle')}
          </h2>
          <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>
            {dashboard.event.type === 'rsvp'
              ? t('salesPage.notTicketedRsvp')
              : t('salesPage.notTicketedRegistration')}
          </p>
          <Link
            href={`/e/${eventId}/manage/guests`}
            className='mt-5 inline-flex h-10 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
          >
            {t('salesPage.viewGuestList')}
          </Link>
        </div>
      </div>
    );
  }

  return <TicketedSales eventId={eventId} pathname={pathname} tickets={dashboard.tickets} />;
}

interface TicketedSalesProps {
  eventId: string;
  pathname: string;
  tickets: NonNullable<EventDashboard['tickets']>;
}

function TicketedSales({ eventId, pathname, tickets }: TicketedSalesProps) {
  const t = useTranslations('manage');
  const { setTopBarForRoute } = useTopBar();
  const { data: sales, isLoading, error, refetch, isRefetching } = useEventSales(eventId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadAttendeesCsv(eventId);
      toast.success(t('salesPage.exportSuccess'));
    } catch (exportError) {
      const message = getErrorMessage(exportError);
      toast.error(message || t('salesPage.exportFailed'));
      logger.error('Failed to export attendees CSV', { eventId, error: message });
    } finally {
      setIsExporting(false);
    }
  }, [eventId, t]);

  useEffect(() => {
    setTopBarForRoute(pathname, {
      textButtons: [
        {
          id: 'export-sales-csv',
          label: isExporting ? t('salesPage.exporting') : t('salesPage.exportCsv'),
          icon: Download,
          onClick: () => {
            void handleExport();
          },
          disabled: isExporting,
          variant: 'outline',
        },
      ],
    });
  }, [pathname, setTopBarForRoute, handleExport, isExporting, t]);

  if (isLoading) {
    return <SalesPageSkeleton />;
  }

  if (error || !sales) {
    return (
      <div className='py-4 md:py-6'>
        <ErrorCard
          title={t('salesPage.unavailable')}
          message={error ? getErrorMessage(error) : t('salesPage.salesLoadError')}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <SalesSummary summary={sales.summary} tickets={tickets} />
      <SalesChart salesOverTime={sales.salesOverTime} />
      <TicketTypeBreakdown
        eventId={eventId}
        ticketTypes={sales.ticketTypes}
        discountCodes={sales.discountCodes}
      />
    </div>
  );
}

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

function ErrorCard({ title, message, onRetry, isRetrying }: ErrorCardProps) {
  const tCommon = useTranslations('common');
  return (
    <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40'>
        <AlertCircle className='h-6 w-6 text-red-500 dark:text-red-400' />
      </div>
      <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
      <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>{message}</p>
      <Button variant='outline' className='mt-5' onClick={onRetry} disabled={isRetrying}>
        {isRetrying && <Loader2 className='animate-spin' />}
        {tCommon('actions.tryAgain')}
      </Button>
    </div>
  );
}

function SalesPageSkeleton() {
  return (
    <div className='space-y-4 py-4 md:py-6'>
      <SalesSummarySkeleton />
      <SalesChartSkeleton />
      <TicketTypeBreakdownSkeleton />
    </div>
  );
}
