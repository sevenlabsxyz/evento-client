'use client';

import { copyEventLink, ManageMoreMenu } from '@/components/manage-dashboard/manage-more-menu';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { usePublishEvent } from '@/lib/hooks/use-publish-event';
import { queryKeys } from '@/lib/query-client';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getAbsoluteAppUrl } from '@/lib/utils/app-url';
import { formatEventDate } from '@/lib/utils/date';
import { getErrorMessage } from '@/lib/utils/error-message';
import { getEventCoverDisplayUrl } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Globe, Lock, Rocket, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';

type DashboardEvent = EventDashboard['event'];

type EventLifecycleStatus = 'cancelled' | 'draft' | 'live' | 'ended' | 'upcoming';

const LIFECYCLE_BADGE_CLASSES: Record<EventLifecycleStatus, string> = {
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
  live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  ended: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300',
  upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
};

const NEUTRAL_BADGE_CLASS = 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300';

function parseTimestamp(iso: string | null): number | null {
  if (!iso) {
    return null;
  }
  const timestamp = new Date(iso).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getLifecycleStatus(event: DashboardEvent, now: number): EventLifecycleStatus {
  if (event.status === 'archived') {
    return 'cancelled';
  }
  if (event.status === 'draft') {
    return 'draft';
  }

  const start = parseTimestamp(event.computed_start_date);
  if (start === null) {
    return 'upcoming';
  }
  const end = parseTimestamp(event.computed_end_date) ?? start;

  if (now < start) {
    return 'upcoming';
  }
  return now <= end ? 'live' : 'ended';
}

/** Returns null when the event has no usable start date. */
function formatScheduleLabel(event: DashboardEvent): string | null {
  if (!event.computed_start_date) {
    return null;
  }

  const timezone = event.timezone ?? undefined;
  const start = formatEventDate(event.computed_start_date, timezone);
  if (!start.date) {
    return null;
  }

  const end = event.computed_end_date ? formatEventDate(event.computed_end_date, timezone) : null;
  if (!end?.date) {
    return `${start.dayOfWeek}, ${start.date} · ${start.timeWithTz}`;
  }

  if (start.date === end.date) {
    return `${start.dayOfWeek}, ${start.date} · ${start.time} – ${end.timeWithTz}`;
  }

  return `${start.dayOfWeek}, ${start.shortDate}, ${start.time} – ${end.dayOfWeek}, ${end.date}, ${end.timeWithTz}`;
}

function HeaderBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}

interface ManageEventHeaderProps {
  event: DashboardEvent;
}

export function ManageEventHeader({ event }: ManageEventHeaderProps) {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const publishEvent = usePublishEvent();
  const [showPublishSheet, setShowPublishSheet] = useState(false);

  const lifecycle = getLifecycleStatus(event, Date.now());
  const lifecycleBadgeClass = LIFECYCLE_BADGE_CLASSES[lifecycle];
  const scheduleLabel = formatScheduleLabel(event) ?? t('header.dateNotSet');
  const isDraft = event.status === 'draft';
  const VisibilityIcon = event.visibility === 'private' ? Lock : Globe;

  const handleShare = async () => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: event.title, url: getAbsoluteAppUrl(`/e/${event.id}`) });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }
    await copyEventLink(event.id, {
      success: t('moreMenu.linkCopied'),
      error: t('moreMenu.linkCopyFailed'),
    });
  };

  const handlePublish = () => {
    publishEvent.mutate(event.id, {
      onSuccess: () => {
        toast.success(t('header.published'));
        setShowPublishSheet(false);
        queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(event.id) });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || t('header.publishFailed'));
      },
    });
  };

  return (
    <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
      <div className='flex min-w-0 items-center gap-3 md:gap-4'>
        <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500 dark:from-rose-600 dark:via-fuchsia-700 dark:to-indigo-700 md:h-16 md:w-16'>
          {event.cover && (
            <Image
              src={getEventCoverDisplayUrl(event.cover, 'thumbnail')}
              alt=''
              fill
              sizes='64px'
              className='object-cover'
            />
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <h2 className='truncate text-lg font-semibold text-gray-900 dark:text-neutral-100 md:text-2xl'>
            {event.title || t('header.untitled')}
          </h2>
          <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>{scheduleLabel}</p>
          <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
            <HeaderBadge className={lifecycleBadgeClass}>
              {lifecycle === 'live' && (
                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400' />
              )}
              {t(`header.lifecycle.${lifecycle}`)}
            </HeaderBadge>
            <HeaderBadge className={NEUTRAL_BADGE_CLASS}>
              <VisibilityIcon className='h-3 w-3' aria-hidden='true' />
              {event.visibility === 'private'
                ? tCommon('labels.private')
                : tCommon('labels.public')}
            </HeaderBadge>
            <HeaderBadge className={NEUTRAL_BADGE_CLASS}>
              {t(`header.type.${event.type}`)}
            </HeaderBadge>
          </div>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <Button
          asChild
          variant='outline'
          size='sm'
          className='flex-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 md:flex-none'
        >
          <Link href={`/e/${event.id}`}>
            <ExternalLink className='mr-1.5 hidden h-4 w-4 sm:block' aria-hidden='true' />
            {t('header.viewEvent')}
          </Link>
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='flex-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 md:flex-none'
          onClick={() => void handleShare()}
        >
          <Share2 className='mr-1.5 hidden h-4 w-4 sm:block' aria-hidden='true' />
          {tCommon('actions.share')}
        </Button>
        {isDraft && (
          <Button
            size='sm'
            className='flex-1 md:flex-none'
            onClick={() => setShowPublishSheet(true)}
          >
            <Rocket className='mr-1.5 hidden h-4 w-4 sm:block' aria-hidden='true' />
            {t('header.publish')}
          </Button>
        )}
        <ManageMoreMenu event={event} />
      </div>

      {isDraft && (
        <MasterScrollableSheet
          title={t('header.publishSheet.title')}
          open={showPublishSheet}
          onOpenChange={setShowPublishSheet}
          footer={
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='h-11 flex-1'
                onClick={() => setShowPublishSheet(false)}
                disabled={publishEvent.isPending}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button
                className='h-11 flex-1'
                onClick={handlePublish}
                disabled={publishEvent.isPending}
              >
                {publishEvent.isPending
                  ? t('header.publishSheet.publishing')
                  : t('header.publishSheet.confirm')}
              </Button>
            </div>
          }
        >
          <div className='px-4 pb-4 text-sm text-gray-600 dark:text-neutral-400'>
            {t('header.publishSheet.description')}
          </div>
        </MasterScrollableSheet>
      )}
    </header>
  );
}
