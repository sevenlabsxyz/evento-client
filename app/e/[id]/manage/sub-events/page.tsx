'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import DeleteConfirmationSheet from '@/components/event-detail/delete-confirmation-sheet';
import LinkSubEventSheet from '@/components/manage-event/link-sub-event-sheet';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUnlinkSubEvent } from '@/lib/hooks/use-unlink-sub-event';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { CalendarPlus, Link2, Plus, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function SubEventsManagementPage() {
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.id as string;
  const router = useRouter();
  const t = useTranslations('manageLegacy');

  const { data: subEvents = [], isLoading, error } = useSubEvents(eventId, { includeDrafts: true });
  const unlinkSubEvent = useUnlinkSubEvent();

  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<EventWithUser | null>(null);

  const linkedEventIds = useMemo(() => subEvents.map((se) => se.id), [subEvents]);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('subEvents.title'),
      leftMode: 'back',
      showAvatar: false,
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      buttons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, pathname, router, setTopBarForRoute, applyRouteConfig, clearRoute, t]);

  const handleCreateNew = () => {
    setShowAddOptions(false);
    router.push(`/e/create?parent_event_id=${eventId}`);
  };

  const handleLinkExisting = () => {
    setShowAddOptions(false);
    setShowLinkSheet(true);
  };

  const handleRemove = async (subEvent: EventWithUser) => {
    try {
      await unlinkSubEvent.mutateAsync({
        parentEventId: eventId,
        subEventId: subEvent.id,
      });
      toast.success(t('subEvents.toasts.removed', { title: subEvent.title }));
    } catch (error: any) {
      toast.error(error?.message || t('subEvents.toasts.removeFailed'));
    }
  };

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('subEvents.heading')}
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('subEvents.description')}
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowAddOptions(true)}
          className='flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
        >
          <Plus className='h-4 w-4' />
          {t('subEvents.addButton')}
        </button>
      </div>

      <div className='rounded-2xl border border-gray-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900'>
        {/* List / states */}
        {isLoading ? (
          <div className='space-y-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-neutral-800'
              >
                <div className='flex flex-1 items-center gap-3'>
                  <Skeleton className='h-12 w-12 rounded-lg' />
                  <div className='flex-1'>
                    <Skeleton className='mb-2 h-4 w-2/3' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                </div>
                <Skeleton className='h-9 w-9 rounded-full' />
              </div>
            ))}
          </div>
        ) : subEvents.length > 0 ? (
          <div className='space-y-2'>
            {subEvents.map((se) => (
              <div
                key={se.id}
                className='flex items-center justify-between rounded-xl border border-gray-100 dark:border-neutral-800 dark:bg-neutral-800'
              >
                <div className='min-w-0 flex-1'>
                  <EventCompactItem event={se} />
                </div>
                {se.status === 'draft' && (
                  <span className='shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'>
                    {t('subEvents.draft')}
                  </span>
                )}
                <button
                  className='mr-2 shrink-0 rounded-full p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingRemove(se);
                    setConfirmOpen(true);
                  }}
                  aria-label={t('subEvents.removeAria', { title: se.title })}
                >
                  <Unlink className='h-5 w-5' />
                </button>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-950'>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {t('subEvents.loadFailed')}
            </p>
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
              <Plus className='h-8 w-8 text-gray-400 dark:text-neutral-500' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
              {t('subEvents.empty.title')}
            </h3>
            <p className='mb-6 text-sm text-gray-500 dark:text-neutral-400'>
              {t('subEvents.empty.description')}
            </p>
            <div className='flex flex-col items-center gap-2'>
              <button
                onClick={handleCreateNew}
                className='w-full max-w-xs rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                {t('subEvents.createNew')}
              </button>
              <button
                onClick={handleLinkExisting}
                className='w-full max-w-xs rounded-lg border border-gray-200 px-6 py-2 text-gray-900 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-950'
              >
                {t('subEvents.linkExisting')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add options sheet */}
      <DetachedSheet.Root
        presented={showAddOptions}
        onPresentedChange={(presented) => !presented && setShowAddOptions(false)}
      >
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='p-6'>
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>

                <h2 className='mb-6 text-xl font-semibold dark:text-neutral-100'>
                  {t('subEvents.addSheet.title')}
                </h2>

                <div className='flex flex-col gap-2 pb-2'>
                  <button
                    onClick={handleCreateNew}
                    className='flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
                  >
                    <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/60'>
                      <CalendarPlus className='h-6 w-6 text-teal-600 dark:text-teal-400' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                        {t('subEvents.createNew')}
                      </h3>
                      <p className='text-sm text-gray-500 dark:text-neutral-400'>
                        {t('subEvents.addSheet.createDescription')}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={handleLinkExisting}
                    className='flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
                  >
                    <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60'>
                      <Link2 className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                    </div>
                    <div className='flex-1 text-left'>
                      <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                        {t('subEvents.linkExisting')}
                      </h3>
                      <p className='text-sm text-gray-500 dark:text-neutral-400'>
                        {t('subEvents.addSheet.linkDescription')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>

      {/* Link existing event sheet */}
      <LinkSubEventSheet
        isOpen={showLinkSheet}
        onClose={() => setShowLinkSheet(false)}
        parentEventId={eventId}
        linkedEventIds={linkedEventIds}
      />

      {/* Remove confirmation sheet */}
      <DeleteConfirmationSheet
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingRemove(null);
        }}
        onConfirm={async () => {
          if (!pendingRemove) return;
          await handleRemove(pendingRemove);
          setConfirmOpen(false);
          setPendingRemove(null);
        }}
        itemType='sub event'
        title={t('subEvents.removeSheet.title')}
        description={
          pendingRemove
            ? t('subEvents.removeSheet.description', { title: pendingRemove.title })
            : t('subEvents.removeSheet.descriptionFallback')
        }
        confirmLabel={t('subEvents.removeSheet.confirm')}
        loadingLabel={t('subEvents.removeSheet.removing')}
        isLoading={unlinkSubEvent.isPending}
      />
    </div>
  );
}
