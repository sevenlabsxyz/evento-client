'use client';

import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCheckIn, useUndoCheckIn } from '@/lib/hooks/use-event-attendees';
import type { Translator } from '@/lib/i18n/types';
import type { EventAttendee } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Check, Loader2, Search, Undo2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { formatCheckInTime } from './check-in-result-card';

type AttendeeFilter = 'all' | 'checked-in' | 'not-checked-in';

type ManageT = Translator<'manage'>;

const FILTERS: Array<{ id: AttendeeFilter }> = [
  { id: 'all' },
  { id: 'checked-in' },
  { id: 'not-checked-in' },
];

function getDisplayName(attendee: EventAttendee, t: ManageT): string {
  return attendee.name || attendee.email || t('attendeeList.guestFallback');
}

interface AttendeeListProps {
  eventId: string;
  attendees: EventAttendee[];
}

export function AttendeeList({ eventId, attendees }: AttendeeListProps) {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const { mutateAsync: checkInAsync } = useCheckIn(eventId);
  const { mutateAsync: undoCheckInAsync } = useUndoCheckIn(eventId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AttendeeFilter>('all');
  const [pendingTicketIds, setPendingTicketIds] = useState<ReadonlySet<string>>(new Set());

  const counts = useMemo(
    () => ({
      all: attendees.length,
      'checked-in': attendees.filter((attendee) => attendee.status === 'used').length,
      'not-checked-in': attendees.filter((attendee) => attendee.status === 'active').length,
    }),
    [attendees]
  );

  const visibleAttendees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendees.filter((attendee) => {
      if (filter === 'checked-in' && attendee.status !== 'used') return false;
      if (filter === 'not-checked-in' && attendee.status !== 'active') return false;
      if (!query) return true;

      return (
        (attendee.name?.toLowerCase().includes(query) ?? false) ||
        (attendee.email?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [attendees, filter, search]);

  const setTicketPending = (ticketId: string, pending: boolean) => {
    setPendingTicketIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(ticketId);
      } else {
        next.delete(ticketId);
      }
      return next;
    });
  };

  const handleCheckIn = async (attendee: EventAttendee) => {
    if (pendingTicketIds.has(attendee.ticketId)) return;

    setTicketPending(attendee.ticketId, true);
    try {
      const result = await checkInAsync({ ticketId: attendee.ticketId });
      if (result.valid) {
        toast.success(t('attendeeList.toastCheckedIn', { name: getDisplayName(attendee, t) }));
      } else {
        toast.error(result.error || t('attendeeList.checkInFailed'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || t('attendeeList.checkInFailed'));
      logger.error('Manual check-in failed', {
        ticketId: attendee.ticketId,
        error: getErrorMessage(error),
      });
    } finally {
      setTicketPending(attendee.ticketId, false);
    }
  };

  const handleUndo = async (attendee: EventAttendee) => {
    if (pendingTicketIds.has(attendee.ticketId)) return;

    setTicketPending(attendee.ticketId, true);
    try {
      await undoCheckInAsync({ ticketId: attendee.ticketId });
      toast.success(t('attendeeList.toastUndone', { name: getDisplayName(attendee, t) }));
    } catch (error) {
      toast.error(getErrorMessage(error) || t('attendeeList.undoFailed'));
      logger.error('Undo check-in failed', {
        ticketId: attendee.ticketId,
        error: getErrorMessage(error),
      });
    } finally {
      setTicketPending(attendee.ticketId, false);
    }
  };

  if (attendees.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <Users className='h-5 w-5 text-gray-500 dark:text-neutral-400' />
        </div>
        <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
          {t('attendeeList.emptyTitle')}
        </p>
        <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
          {t('attendeeList.emptyBody')}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label={t('attendeeList.sectionLabel')}
      className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
    >
      <div className='space-y-3 border-b border-gray-100 p-4 dark:border-neutral-800'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
          <Input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('attendeeList.searchPlaceholder')}
            aria-label={t('attendeeList.searchLabel')}
            className='h-10 rounded-xl bg-gray-50 pl-9 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500'
          />
        </div>

        <div
          role='tablist'
          aria-label={t('attendeeList.filterLabel')}
          className='flex gap-2 overflow-x-auto'
        >
          {FILTERS.map((option) => {
            const isActive = filter === option.id;

            return (
              <button
                key={option.id}
                type='button'
                role='tab'
                aria-selected={isActive}
                onClick={() => setFilter(option.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                )}
              >
                {option.id === 'all'
                  ? tCommon('labels.all')
                  : option.id === 'checked-in'
                    ? t('attendeeList.filters.checkedIn')
                    : t('attendeeList.filters.notCheckedIn')}
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isActive
                      ? 'text-white/70 dark:text-neutral-900/60'
                      : 'text-gray-500 dark:text-neutral-400'
                  )}
                >
                  {counts[option.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleAttendees.length === 0 ? (
        <div className='px-4 py-10 text-center'>
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            {t('attendeeList.noMatchTitle')}
          </p>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            {t('attendeeList.noMatchBody')}
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 dark:divide-neutral-800'>
          {visibleAttendees.map((attendee) => {
            const isPending = pendingTicketIds.has(attendee.ticketId);
            const displayName = getDisplayName(attendee, t);
            const checkedInTime =
              attendee.status === 'used' && attendee.checkedInAt
                ? formatCheckInTime(attendee.checkedInAt)
                : '';

            return (
              <li key={attendee.ticketId} className='flex items-center gap-3 px-4 py-3'>
                <UserAvatar
                  size='base'
                  className='shrink-0'
                  user={{ name: displayName, image: attendee.image }}
                />

                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                    {displayName}
                  </p>
                  {attendee.email && attendee.name ? (
                    <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                      {attendee.email}
                    </p>
                  ) : null}
                  <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                    {attendee.ticketType ? (
                      <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-300'>
                        {attendee.ticketType}
                      </span>
                    ) : null}
                    {attendee.status === 'used' ? (
                      <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'>
                        {checkedInTime
                          ? t('attendeeList.checkedInAt', { time: checkedInTime })
                          : t('attendeeList.checkedIn')}
                      </span>
                    ) : attendee.status === 'cancelled' ? (
                      <span className='rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300'>
                        {t('attendeeList.cancelled')}
                      </span>
                    ) : (
                      <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'>
                        {t('attendeeList.notCheckedIn')}
                      </span>
                    )}
                  </div>
                </div>

                {attendee.status === 'active' ? (
                  <button
                    type='button'
                    onClick={() => handleCheckIn(attendee)}
                    disabled={isPending}
                    aria-label={t('attendeeList.checkInLabel', { name: displayName })}
                    className='flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gray-900 px-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                  >
                    {isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Check className='h-4 w-4' />
                    )}
                    {t('attendeeList.checkIn')}
                  </button>
                ) : attendee.status === 'used' ? (
                  <button
                    type='button'
                    onClick={() => handleUndo(attendee)}
                    disabled={isPending}
                    aria-label={t('attendeeList.undoLabel', { name: displayName })}
                    className='flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  >
                    {isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Undo2 className='h-4 w-4' />
                    )}
                    {t('attendeeList.undo')}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
