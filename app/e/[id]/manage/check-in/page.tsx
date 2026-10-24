'use client';

import { AttendeeList } from '@/components/manage-dashboard/check-in/attendee-list';
import { CheckInResultCard } from '@/components/manage-dashboard/check-in/check-in-result-card';
import {
  CheckInScannerSheet,
  extractTicketToken,
} from '@/components/manage-dashboard/check-in/check-in-scanner-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckIn, useEventAttendees } from '@/lib/hooks/use-event-attendees';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { CheckInResult } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { AlertCircle, Loader2, QrCode, ScanLine, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

export default function EventCheckInPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const { data: dashboard, isLoading, error, refetch, isRefetching } = useEventDashboard(eventId);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Check-in',
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
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute]);

  if (isLoading) {
    return <CheckInSkeleton />;
  }

  // The manage layout redirects non-hosts away; render nothing meanwhile.
  if (error?.status === 403) {
    return null;
  }

  if (error || !dashboard) {
    return (
      <div className='py-4 md:py-6'>
        <ErrorCard
          title='Check-in unavailable'
          message={getErrorMessage(error) || "We couldn't load this event."}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  if (dashboard.event.type !== 'ticketed') {
    return (
      <div className='py-4 md:py-6'>
        <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
            <Ticket className='h-6 w-6 text-gray-500 dark:text-neutral-400' />
          </div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            Check-in is for ticketed events
          </h2>
          <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>
            Door check-in scans the QR code on each guest&apos;s ticket. This event uses{' '}
            {dashboard.event.type === 'rsvp' ? 'RSVPs' : 'registration'}, so there are no tickets to
            scan. Use the guest list to see who&apos;s coming.
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

  return <TicketedCheckIn eventId={eventId} />;
}

function TicketedCheckIn({ eventId }: { eventId: string }) {
  const { data, isLoading, error, refetch, isRefetching } = useEventAttendees(eventId);
  const { mutateAsync: checkInAsync, isPending: isCheckingIn } = useCheckIn(eventId);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualResult, setManualResult] = useState<CheckInResult | null>(null);

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = extractTicketToken(manualToken);
    if (!token || isCheckingIn) return;

    setManualResult(null);
    try {
      const result = await checkInAsync({ token });
      setManualResult(result);
      if (result.valid) {
        setManualToken('');
      }
    } catch (submitError) {
      logger.error('Manual token check-in failed', { error: getErrorMessage(submitError) });
      setManualResult({
        valid: false,
        error: getErrorMessage(submitError) || 'Check-in failed. Please try again.',
      });
    }
  };

  if (isLoading) {
    return <CheckInSkeleton />;
  }

  if (error || !data) {
    return (
      <div className='py-4 md:py-6'>
        <ErrorCard
          title='Attendees unavailable'
          message={getErrorMessage(error) || "We couldn't load the attendee list."}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  const { total, checkedIn } = data.summary;
  const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const remaining = Math.max(total - checkedIn, 0);

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <section
          aria-label='Check-in progress'
          className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
        >
          <p className='text-sm font-medium text-gray-500 dark:text-neutral-400'>Checked in</p>
          <div className='mt-1 flex items-baseline gap-1.5'>
            <span className='text-3xl font-semibold tabular-nums text-gray-900 dark:text-neutral-100'>
              {checkedIn}
            </span>
            <span className='text-base tabular-nums text-gray-500 dark:text-neutral-400'>
              / {total}
            </span>
          </div>
          <div
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label='Checked-in percentage'
            className='mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800'
          >
            <div
              className='h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out dark:bg-emerald-400'
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className='mt-2 text-xs text-gray-500 dark:text-neutral-400'>
            {total === 0
              ? 'No tickets issued yet'
              : `${percent}% arrived · ${remaining} still to check in`}
          </p>
        </section>

        <section
          aria-label='Check in a ticket'
          className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
        >
          <button
            type='button'
            onClick={() => setIsScannerOpen(true)}
            className='flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
          >
            <ScanLine className='h-5 w-5' />
            Scan tickets
          </button>

          <form onSubmit={handleManualSubmit} className='flex gap-2'>
            <div className='relative min-w-0 flex-1'>
              <QrCode className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
              <input
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder='Paste ticket code'
                aria-label='Ticket code'
                autoComplete='off'
                autoCapitalize='off'
                spellCheck={false}
                className='h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-neutral-600'
              />
            </div>
            <button
              type='submit'
              disabled={!manualToken.trim() || isCheckingIn}
              className='flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800'
            >
              {isCheckingIn ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              Check in
            </button>
          </form>

          {manualResult ? (
            <CheckInResultCard result={manualResult} onDismiss={() => setManualResult(null)} />
          ) : null}
        </section>
      </div>

      <AttendeeList eventId={eventId} attendees={data.attendees} />

      <CheckInScannerSheet eventId={eventId} open={isScannerOpen} onOpenChange={setIsScannerOpen} />
    </div>
  );
}

function ErrorCard({
  title,
  message,
  onRetry,
  isRetrying,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50'>
        <AlertCircle className='h-6 w-6 text-red-500 dark:text-red-400' />
      </div>
      <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
      <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-neutral-400'>{message}</p>
      <button
        type='button'
        onClick={onRetry}
        disabled={isRetrying}
        className='mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
      >
        {isRetrying ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
        Try again
      </button>
    </div>
  );
}

function CheckInSkeleton() {
  return (
    <div className='space-y-4 py-4 md:py-6' aria-busy='true' aria-label='Loading check-in'>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='mt-3 h-8 w-24' />
          <Skeleton className='mt-4 h-2 w-full rounded-full' />
          <Skeleton className='mt-3 h-3 w-40' />
        </div>
        <div className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
          <Skeleton className='h-11 w-full rounded-full' />
          <Skeleton className='h-10 w-full rounded-full' />
        </div>
      </div>
      <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='space-y-3 border-b border-gray-100 p-4 dark:border-neutral-800'>
          <Skeleton className='h-10 w-full rounded-xl' />
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-14 rounded-full' />
            <Skeleton className='h-8 w-28 rounded-full' />
            <Skeleton className='h-8 w-32 rounded-full' />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-neutral-800'
          >
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-36' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-9 w-24 rounded-full' />
          </div>
        ))}
      </div>
    </div>
  );
}
