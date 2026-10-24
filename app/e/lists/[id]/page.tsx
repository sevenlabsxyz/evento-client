'use client';

import { DeleteListDialog } from '@/components/lists/delete-list-dialog';
import { ListActionsMenu } from '@/components/lists/list-actions-menu';
import { ListEmptyPanel } from '@/components/lists/list-empty-panel';
import { ListEventCard } from '@/components/lists/list-event-card';
import { ListFormDialog } from '@/components/lists/list-form-dialog';
import { ListLoadError } from '@/components/lists/list-load-error';
import { ListPageHeader } from '@/components/lists/list-page-header';
import {
  LIST_EVENT_GRID_CLASS,
  LIST_PAGE_BACKGROUND_CLASS,
  LIST_PAGE_CONTAINER_CLASS,
} from '@/components/lists/list-page-layout';
import {
  ListEventFilter,
  ListEventSort,
  filterListEvents,
  formatRelativeTime,
  getListLastActivity,
  isDefaultList,
  isPastEvent,
  sortListEvents,
} from '@/components/lists/list-utils';
import { ListDetailSkeleton } from '@/components/lists/lists-skeletons';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAddEventToList } from '@/lib/hooks/use-add-event-to-list';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useListEvents } from '@/lib/hooks/use-list-events';
import { useRemoveEventFromList } from '@/lib/hooks/use-remove-event-from-list';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { useTopBar } from '@/lib/stores/topbar-store';
import { ListEvent, UserList } from '@/lib/types/api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import {
  ArrowUpDown,
  Bookmark,
  CalendarClock,
  Compass,
  History,
  LayoutGrid,
  LucideIcon,
  SearchX,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const FILTERS: { id: ListEventFilter; icon: LucideIcon }[] = [
  { id: 'upcoming', icon: CalendarClock },
  { id: 'past', icon: History },
  { id: 'all', icon: LayoutGrid },
];

const SORT_KEYS = {
  added: 'added',
  'event-date': 'eventDate',
} as const satisfies Record<ListEventSort, string>;

const SORT_OPTIONS: ListEventSort[] = ['added', 'event-date'];

const UNDO_TOAST_DURATION_MS = 6000;

/** API client rejections are plain `{ message, status }` objects, not `Error`s. */
function isNotFoundError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'status' in error && error.status === 404);
}

export default function SavedListDetailPage() {
  const t = useTranslations('lists');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listId = params.id;
  const pathname = `/e/lists/${listId}`;
  const isMobile = useIsMobile();
  const { isAuthenticated, isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  // The list being deleted: its queries stop (no 404 refetch) and the page shows a
  // skeleton until the deletion settles and navigates away.
  const [leavingList, setLeavingList] = useState<UserList | null>(null);
  const isLeaving = leavingList !== null;
  const [filter, setFilter] = useState<ListEventFilter | null>(null);
  const [sort, setSort] = useState<ListEventSort>('added');
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const pendingRemovals = useRef(new Map<string, Promise<unknown>>());

  const {
    data: lists,
    isLoading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useUserLists(isAuthenticated);
  const {
    data: listEvents,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useListEvents(listId, isAuthenticated && !isLeaving);
  const removeEvent = useRemoveEventFromList();
  const addEvent = useAddEventToList();

  const currentList = lists?.find((list) => list.id === listId);
  const listName = currentList?.name ?? '';
  const isDefault = currentList && lists ? isDefaultList(currentList, lists) : false;

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: listName || t('detail.topBarFallback'),
      subtitle: '',
      leftMode: 'back',
      onBackPress: () => router.push('/e/lists'),
      centerMode: 'title',
      showAvatar: false,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      textButtons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, listName, router, applyRouteConfig, setTopBarForRoute, clearRoute, t]);

  const entries = useMemo(() => listEvents ?? [], [listEvents]);
  const upcomingCount = useMemo(
    () => entries.filter((entry) => !isPastEvent(entry.event, nowMs)).length,
    [entries, nowMs]
  );
  const pastCount = entries.length - upcomingCount;
  // Land on Upcoming unless everything saved has already happened.
  const activeFilter: ListEventFilter =
    filter ?? (upcomingCount === 0 && pastCount > 0 ? 'all' : 'upcoming');
  const visibleEntries = useMemo(
    () => sortListEvents(filterListEvents(entries, activeFilter, nowMs), sort, nowMs),
    [entries, activeFilter, sort, nowMs]
  );

  const handleRemove = (entry: ListEvent) => {
    const removal = removeEvent.mutateAsync({ listId, eventId: entry.event_id });
    pendingRemovals.current.set(entry.event_id, removal);

    const toastId = toast.success(
      t('detail.removedMessage', { title: entry.event.title, list: listName }),
      t('detail.removedTitle'),
      UNDO_TOAST_DURATION_MS,
      {
        action: {
          label: t('detail.undo'),
          onClick: () => void handleUndo(entry),
        },
      }
    );

    removal
      .catch((error: unknown) => {
        toast.dismiss(toastId);
        toast.error(getErrorMessage(error), t('detail.removeFailed'));
      })
      .finally(() => {
        if (pendingRemovals.current.get(entry.event_id) === removal) {
          pendingRemovals.current.delete(entry.event_id);
        }
      });
  };

  const handleUndo = async (entry: ListEvent) => {
    try {
      // Re-adding before the delete lands would hit "already in list" and then vanish.
      await pendingRemovals.current.get(entry.event_id);
    } catch {
      // The removal failed and was rolled back; nothing to undo.
      return;
    }

    try {
      await addEvent.mutateAsync({ listId, eventId: entry.event_id, restore: entry });
    } catch (error) {
      toast.error(getErrorMessage(error), t('detail.restoreFailed'));
    }
  };

  const isNotFound =
    !isLeaving && ((lists !== undefined && !currentList) || isNotFoundError(eventsError));

  const renderEvents = (list: UserList) => {
    if (eventsError) {
      return (
        <ListLoadError
          title={t('detail.loadEventsError')}
          message={getErrorMessage(eventsError)}
          onRetry={() => void refetchEvents()}
        />
      );
    }

    if (entries.length === 0) {
      return (
        <ListEmptyPanel
          icon={Bookmark}
          title={t('detail.emptyTitle')}
          description={t('detail.emptyDescription')}
        >
          <Button asChild>
            <Link href='/e/hub#discover'>
              <Compass aria-hidden='true' />
              {t('exploreDiscover')}
            </Link>
          </Button>
          <Button
            asChild
            variant='outline'
            className='dark:bg-neutral-900 dark:hover:bg-neutral-800'
          >
            <Link href='/e/search'>{t('searchEvents')}</Link>
          </Button>
        </ListEmptyPanel>
      );
    }

    if (visibleEntries.length === 0) {
      const isUpcoming = activeFilter === 'upcoming';
      return (
        <ListEmptyPanel
          icon={isUpcoming ? CalendarClock : History}
          title={isUpcoming ? t('detail.noUpcomingTitle') : t('detail.noPastTitle')}
          description={
            isUpcoming ? t('detail.noUpcomingDescription') : t('detail.noPastDescription')
          }
        >
          <Button
            type='button'
            variant='outline'
            onClick={() => setFilter(isUpcoming ? 'past' : 'upcoming')}
            className='dark:bg-neutral-900 dark:hover:bg-neutral-800'
          >
            {isUpcoming ? t('detail.showPast') : t('detail.showUpcoming')}
          </Button>
        </ListEmptyPanel>
      );
    }

    return (
      <ul
        className={LIST_EVENT_GRID_CLASS}
        aria-label={t('detail.eventsInList', { name: list.name })}
      >
        {visibleEntries.map((entry) => (
          <li key={entry.list_event_id}>
            <ListEventCard entry={entry} listName={list.name} onRemove={handleRemove} />
          </li>
        ))}
      </ul>
    );
  };

  const renderBody = () => {
    // Unauthenticated visitors are being redirected, and a list being deleted is
    // about to navigate away; keep the skeleton up in both cases.
    if (isLeaving || isCheckingAuth || !isAuthenticated || listsLoading || eventsLoading) {
      return <ListDetailSkeleton />;
    }

    if (listsError || isNotFound || !currentList) {
      return (
        <div className={LIST_PAGE_BACKGROUND_CLASS}>
          <div className={LIST_PAGE_CONTAINER_CLASS}>
            {listsError ? (
              <ListLoadError
                title={t('detail.loadError')}
                message={getErrorMessage(listsError)}
                onRetry={() => void refetchLists()}
              />
            ) : (
              <ListEmptyPanel
                icon={SearchX}
                title={t('detail.notFoundTitle')}
                description={t('detail.notFoundDescription')}
              >
                <Button asChild>
                  <Link href='/e/lists'>{t('detail.backToLists')}</Link>
                </Button>
              </ListEmptyPanel>
            )}
          </div>
        </div>
      );
    }

    const updatedLabel = formatRelativeTime(getListLastActivity(currentList, listEvents));

    return (
      <div className={LIST_PAGE_BACKGROUND_CLASS}>
        <div className={LIST_PAGE_CONTAINER_CLASS}>
          <ListPageHeader
            backLink={{ href: '/e/lists', label: t('detail.allLists') }}
            eyebrow={isDefault ? t('detail.eyebrowDefault') : t('detail.eyebrow')}
            title={currentList.name}
            description={currentList.description ?? undefined}
            meta={
              <span className='flex flex-wrap items-center gap-x-1.5'>
                <span className='font-medium text-gray-700 dark:text-neutral-300'>
                  {t('eventCount', { count: entries.length })}
                </span>
                {entries.length > 0 && (
                  <>
                    <span aria-hidden='true' className='text-gray-300 dark:text-neutral-600'>
                      ·
                    </span>
                    <span>{t('detail.upcomingCount', { count: upcomingCount })}</span>
                  </>
                )}
                {updatedLabel && (
                  <>
                    <span aria-hidden='true' className='text-gray-300 dark:text-neutral-600'>
                      ·
                    </span>
                    <span>{t('updated', { time: updatedLabel })}</span>
                  </>
                )}
              </span>
            }
            actions={
              <>
                <Button
                  asChild
                  variant='outline'
                  className='flex-1 dark:bg-neutral-900 dark:hover:bg-neutral-800 md:flex-none'
                >
                  <Link href='/e/hub#discover'>
                    <Compass aria-hidden='true' />
                    {t('detail.findEvents')}
                  </Link>
                </Button>
                <ListActionsMenu
                  appearance='outline'
                  listName={currentList.name}
                  onRename={() => setIsRenameOpen(true)}
                  onDelete={isDefault ? undefined : () => setIsDeleteOpen(true)}
                />
              </>
            }
          />

          {entries.length > 0 && !eventsError && (
            <div className='mt-6 flex items-center justify-between gap-3'>
              <div className='scrollbar-hide -mx-4 min-w-0 overflow-x-auto px-4 md:mx-0 md:px-0'>
                <AnimatedTabs
                  expanded={!isMobile}
                  tabs={FILTERS.map((option) => ({
                    title: t(`detail.filters.${option.id}`),
                    icon: option.icon,
                    onClick: () => setFilter(option.id),
                  }))}
                  selected={FILTERS.findIndex((option) => option.id === activeFilter)}
                />
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    className='shrink-0 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                    aria-label={t(`detail.sortAria.${SORT_KEYS[sort]}`)}
                  >
                    <ArrowUpDown aria-hidden='true' />
                    <span className='hidden sm:inline'>{t(`detail.sort.${SORT_KEYS[sort]}`)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-44 rounded-xl p-1'>
                  <DropdownMenuLabel className='px-2.5 text-xs font-medium text-gray-500 dark:text-neutral-500'>
                    {t('detail.sortBy')}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => {
                      if (value === 'added' || value === 'event-date') setSort(value);
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option}
                        value={option}
                        className='rounded-lg py-2'
                      >
                        {t(`detail.sort.${SORT_KEYS[option]}`)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className='mt-6'>{renderEvents(currentList)}</div>
        </div>
      </div>
    );
  };

  // The delete dialog keeps the same tree position across states so its pending
  // request survives the switch to the skeleton while the deletion settles.
  const deleteDialogList = currentList ?? leavingList;

  return (
    <>
      {renderBody()}
      {currentList && (
        <ListFormDialog
          open={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          lists={lists ?? []}
          list={currentList}
        />
      )}
      {deleteDialogList && (
        <DeleteListDialog
          list={deleteDialogList}
          eventCount={entries.length}
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onDeleteStart={() => setLeavingList(deleteDialogList)}
          onDeleteSettled={(deleted) => {
            if (deleted) {
              router.replace('/e/lists');
            } else {
              setLeavingList(null);
            }
          }}
        />
      )}
    </>
  );
}
