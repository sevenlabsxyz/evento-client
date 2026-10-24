'use client';

import { DeleteListDialog } from '@/components/lists/delete-list-dialog';
import { ListCard, ListCardSkeleton } from '@/components/lists/list-card';
import { ListFormDialog } from '@/components/lists/list-form-dialog';
import { ListLoadError } from '@/components/lists/list-load-error';
import { ListPageHeader } from '@/components/lists/list-page-header';
import {
  LIST_GRID_CLASS,
  LIST_PAGE_BACKGROUND_CLASS,
  LIST_PAGE_CONTAINER_CLASS,
} from '@/components/lists/list-page-layout';
import { isDefaultList, orderLists } from '@/components/lists/list-utils';
import { ListsEmptyState } from '@/components/lists/lists-empty-state';
import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useEnsureDefaultList } from '@/lib/hooks/use-ensure-default-list';
import { useListsEvents } from '@/lib/hooks/use-list-events';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { useTopBar } from '@/lib/stores/topbar-store';
import { UserList } from '@/lib/types/api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

const LISTS_PATHNAME = '/e/lists';

export default function SavedListsPage() {
  const t = useTranslations('lists');
  const { isAuthenticated } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useUserLists(isAuthenticated);
  const { isCreatingDefaultList } = useEnsureDefaultList(isAuthenticated);

  const orderedLists = useMemo(() => orderLists(lists ?? []), [lists]);
  const listIds = useMemo(() => orderedLists.map((list) => list.id), [orderedLists]);
  const eventsByList = useListsEvents(listIds);

  // Targets outlive `open` so dialog copy doesn't change during the close animation.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<UserList | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserList | null>(null);

  useEffect(() => {
    applyRouteConfig(LISTS_PATHNAME);
    setTopBarForRoute(LISTS_PATHNAME, {
      title: t('index.topBarTitle'),
      subtitle: '',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: true,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      textButtons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(LISTS_PATHNAME);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, t]);

  const summaries = listIds.map((id) => eventsByList[id]);
  const allEventsLoaded = summaries.every((summary) => summary && !summary.isLoading);
  // Unauthenticated visitors are being redirected; keep skeletons up meanwhile.
  const isLoadingLists =
    !isAuthenticated || listsLoading || (orderedLists.length === 0 && isCreatingDefaultList);
  const isReady = !isLoadingLists && !listsError && allEventsLoaded;
  // An event saved to several lists counts once.
  const totalSaved = new Set(
    summaries.flatMap((summary) => summary?.events?.map((listEvent) => listEvent.event_id) ?? [])
  ).size;
  const showSaveGuide = isReady && totalSaved === 0;

  const openCreate = () => {
    setRenameTarget(null);
    setIsFormOpen(true);
  };

  const renderLists = () => {
    if (isLoadingLists) {
      return (
        <div className={LIST_GRID_CLASS}>
          {Array.from({ length: 4 }, (_, index) => (
            <ListCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (listsError) {
      return (
        <ListLoadError
          title={t('index.loadError')}
          message={getErrorMessage(listsError)}
          onRetry={() => void refetchLists()}
        />
      );
    }

    if (orderedLists.length === 0) return null;

    return (
      <section aria-labelledby='lists-grid-heading'>
        <h2
          id='lists-grid-heading'
          className='mb-4 text-xl font-semibold text-gray-900 dark:text-neutral-100'
        >
          {t('index.yourLists')}
        </h2>
        <div className={LIST_GRID_CLASS}>
          {orderedLists.map((list) => {
            const summary = eventsByList[list.id];
            const isDefault = isDefaultList(list, orderedLists);
            return (
              <ListCard
                key={list.id}
                list={list}
                events={summary?.events}
                isLoadingEvents={summary?.isLoading ?? true}
                isDefault={isDefault}
                onRename={() => {
                  setRenameTarget(list);
                  setIsFormOpen(true);
                }}
                onDelete={
                  isDefault
                    ? undefined
                    : () => {
                        setDeleteTarget(list);
                        setIsDeleteOpen(true);
                      }
                }
              />
            );
          })}
          <button
            type='button'
            onClick={openCreate}
            className='group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100 dark:focus-visible:ring-offset-neutral-900'
          >
            <span className='flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-105 dark:bg-neutral-800 dark:shadow-none'>
              <Plus className='h-5 w-5' aria-hidden='true' />
            </span>
            <span className='text-sm font-medium'>{t('index.newList')}</span>
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className={LIST_PAGE_BACKGROUND_CLASS}>
      <div className={LIST_PAGE_CONTAINER_CLASS}>
        <ListPageHeader
          eyebrow={t('index.eyebrow')}
          title={t('index.title')}
          description={t('index.description')}
          meta={
            isReady && orderedLists.length > 0
              ? t('index.meta', { saved: totalSaved, lists: orderedLists.length })
              : undefined
          }
          actions={
            <Button
              type='button'
              onClick={openCreate}
              disabled={!isAuthenticated}
              className='w-full md:w-auto'
            >
              <Plus aria-hidden='true' />
              {t('index.newList')}
            </Button>
          }
        />

        <div className='mt-8 space-y-10'>
          {showSaveGuide && <ListsEmptyState />}
          {renderLists()}
        </div>
      </div>

      <ListFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        lists={orderedLists}
        list={renameTarget}
      />

      <DeleteListDialog
        list={deleteTarget}
        eventCount={deleteTarget ? (eventsByList[deleteTarget.id]?.events?.length ?? null) : null}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </div>
  );
}
