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
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function EventSalesPage() {
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
      title: 'Sales',
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute]);

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
          title='Sales unavailable'
          message={error ? getErrorMessage(error) : "We couldn't load this event."}
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
            Sales are for ticketed events
          </h2>
          <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>
            Revenue, orders, and ticket breakdowns appear here when guests buy tickets. This event
            uses {dashboard.event.type === 'rsvp' ? 'RSVPs' : 'registration'}, so there are no sales
            to report. Use the guest list to see who&apos;s coming.
          </p>
          <Link
            href={`/e/${eventId}/manage/guests`}
            className='mt-5 inline-flex h-10 items-center justify-center rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
          >
            View guest list
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
  const { setTopBarForRoute } = useTopBar();
  const { data: sales, isLoading, error, refetch, isRefetching } = useEventSales(eventId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadAttendeesCsv(eventId);
      toast.success('Attendee list downloaded');
    } catch (exportError) {
      const message = getErrorMessage(exportError);
      toast.error(message || 'Failed to export attendees');
      logger.error('Failed to export attendees CSV', { eventId, error: message });
    } finally {
      setIsExporting(false);
    }
  }, [eventId]);

  useEffect(() => {
    setTopBarForRoute(pathname, {
      textButtons: [
        {
          id: 'export-sales-csv',
          label: isExporting ? 'Exporting…' : 'Export CSV',
          icon: Download,
          onClick: () => {
            void handleExport();
          },
          disabled: isExporting,
          variant: 'outline',
        },
      ],
    });
  }, [pathname, setTopBarForRoute, handleExport, isExporting]);

  if (isLoading) {
    return <SalesPageSkeleton />;
  }

  if (error || !sales) {
    return (
      <div className='py-4 md:py-6'>
        <ErrorCard
          title='Sales unavailable'
          message={error ? getErrorMessage(error) : "We couldn't load sales for this event."}
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
  return (
    <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40'>
        <AlertCircle className='h-6 w-6 text-red-500 dark:text-red-400' />
      </div>
      <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
      <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>{message}</p>
      <Button variant='outline' className='mt-5' onClick={onRetry} disabled={isRetrying}>
        {isRetrying && <Loader2 className='animate-spin' />}
        Try again
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
