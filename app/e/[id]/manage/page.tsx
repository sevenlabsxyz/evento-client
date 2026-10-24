'use client';

import {
  ActivityFeed,
  ActivityFeedSkeleton,
} from '@/components/manage-dashboard/overview/activity-feed';
import {
  InsightsChart,
  InsightsChartSkeleton,
} from '@/components/manage-dashboard/overview/insights-chart';
import { PendingApprovals } from '@/components/manage-dashboard/overview/pending-approvals';
import { QuickActions } from '@/components/manage-dashboard/overview/quick-actions';
import {
  SetupChecklist,
  SetupChecklistSkeleton,
} from '@/components/manage-dashboard/overview/setup-checklist';
import { ShareCard } from '@/components/manage-dashboard/overview/share-card';
import { StatCards, StatCardsSkeleton } from '@/components/manage-dashboard/overview/stat-cards';
import {
  UpcomingComms,
  UpcomingCommsSkeleton,
} from '@/components/manage-dashboard/overview/upcoming-comms';
import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import InviteUsersSheet from '@/components/manage-event/invite-users-sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { queryKeys } from '@/lib/query-client';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ManageEventPage() {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading, error, refetch, isRefetching } = useEventDashboard(eventId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: tCommon('actions.manage'),
      leftMode: 'back',
      onBackPress: () => router.push(`/e/${eventId}?from=manage`),
      showAvatar: false,
      subtitle: undefined,
      centerMode: 'title',
      textButtons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, applyRouteConfig, clearRoute, pathname, router, eventId, tCommon]);

  if (isLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <StatCardsSkeleton />
        <div className='grid gap-4 lg:grid-cols-3'>
          <div className='space-y-4 lg:col-span-2'>
            <InsightsChartSkeleton />
            <ActivityFeedSkeleton />
          </div>
          <div className='space-y-4'>
            <SetupChecklistSkeleton />
            <Skeleton className='h-44 w-full rounded-2xl' />
            <UpcomingCommsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // 403/404 are handled by the manage layout (redirect / not-found card).
  if (error?.status === 403 || error?.status === 404) {
    return null;
  }

  if (error || !dashboard) {
    return (
      <div className='py-4 md:py-6'>
        <div className='flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <AlertTriangle className='mb-3 h-8 w-8 text-red-500 dark:text-red-400' />
          <p className='font-medium text-gray-900 dark:text-neutral-100'>
            {t('overviewPage.loadError')}
          </p>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            {error?.message || tCommon('states.errorTryAgain')}
          </p>
          <Button
            variant='outline'
            className='mt-4 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? t('overviewPage.retrying') : tCommon('actions.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  const openInvite = () => setIsInviteOpen(true);
  const pendingRegistrations = dashboard.registration?.pending ?? 0;

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <StatCards dashboard={dashboard} />

      <div className='grid gap-4 lg:grid-cols-3'>
        <div className='space-y-4 lg:col-span-2'>
          {pendingRegistrations > 0 && (
            <PendingApprovals eventId={eventId} pendingCount={pendingRegistrations} />
          )}
          <InsightsChart dashboard={dashboard} />
          <ActivityFeed dashboard={dashboard} />
        </div>
        <div className='space-y-4'>
          <SetupChecklist dashboard={dashboard} onInviteGuests={openInvite} />
          <QuickActions dashboard={dashboard} onInviteGuests={openInvite} />
          <UpcomingComms dashboard={dashboard} />
          <ShareCard dashboard={dashboard} />
        </div>
      </div>

      {dashboard.event.status !== 'archived' && (
        <section className='rounded-2xl border border-red-200 bg-white p-4 dark:border-red-900/60 dark:bg-neutral-900'>
          <h2 className='text-base font-semibold text-red-600 dark:text-red-400'>
            {t('overviewPage.dangerZone')}
          </h2>
          <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-gray-600 dark:text-neutral-400'>
              {t('overviewPage.cancelDescription')}
            </p>
            <Button
              variant='outline'
              className='shrink-0 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300'
              onClick={() => setShowCancelModal(true)}
            >
              <X className='h-4 w-4' />
              {t('overviewPage.cancelEvent')}
            </Button>
          </div>
        </section>
      )}

      <CancelEventModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        eventId={eventId}
        eventTitle={dashboard.event.title}
      />

      {isInviteOpen && (
        <InviteUsersSheet
          eventId={eventId}
          onClose={() => {
            setIsInviteOpen(false);
            queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
          }}
          isOpen={isInviteOpen}
        />
      )}
    </div>
  );
}
