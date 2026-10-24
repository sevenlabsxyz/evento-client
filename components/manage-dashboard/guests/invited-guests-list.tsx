'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventInvitesList } from '@/lib/hooks/use-event-invites-list';
import type {
  EventDashboard,
  EventInvitePerson,
  EventInviteRecord,
  EventInviteStatusFilter,
} from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { Loader2, Mail, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatGuestDate } from './format-guest-date';

const FILTERS: Array<{
  id: EventInviteStatusFilter;
  label: string;
  countKey: keyof EventDashboard['invites'];
}> = [
  { id: 'all', label: 'All', countKey: 'total' },
  { id: 'pending', label: 'Pending', countKey: 'pending' },
  { id: 'responded', label: 'Responded', countKey: 'responded' },
  { id: 'expired', label: 'Expired', countKey: 'expired' },
];

const STATUS_BADGES: Record<EventInviteRecord['status'], { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  responded: {
    label: 'Responded',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

const RESPONSE_BADGES: Record<
  NonNullable<EventInviteRecord['response']>,
  { label: string; className: string }
> = {
  yes: {
    label: 'Going',
    className: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300',
  },
  maybe: {
    label: 'Maybe',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
  no: {
    label: 'Not going',
    className: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  },
};

const EMPTY_FILTER_COPY: Record<Exclude<EventInviteStatusFilter, 'all'>, string> = {
  pending: 'No invites are waiting for a response.',
  responded: 'No one has responded to an invite yet.',
  expired: 'No invites have expired.',
};

function getPersonName(person: EventInvitePerson): string {
  return person.name || person.username || 'Evento user';
}

function getInviteeLabel(invite: EventInviteRecord): string {
  if (invite.invitee) return getPersonName(invite.invitee);
  return invite.invitee_email || 'Unknown invitee';
}

function getInviteeSublabel(invite: EventInviteRecord): string {
  if (invite.invitee) {
    return invite.invitee.username ? `@${invite.invitee.username}` : '';
  }
  return 'Email invite';
}

function matchesSearch(invite: EventInviteRecord, query: string): boolean {
  if (!query) return true;

  return [
    invite.invitee?.name,
    invite.invitee?.username,
    invite.invitee_email,
    invite.inviter?.name,
    invite.inviter?.username,
  ].some((value) => (value || '').toLowerCase().includes(query));
}

interface InvitedGuestsListProps {
  eventId: string;
  counts: EventDashboard['invites'] | undefined;
  onInvite: () => void;
}

export function InvitedGuestsList({ eventId, counts, onInvite }: InvitedGuestsListProps) {
  const [filter, setFilter] = useState<EventInviteStatusFilter>('all');
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch, isRefetching } = useEventInvitesList(eventId, filter);

  const query = search.trim().toLowerCase();
  const invites = useMemo(
    () => (data ?? []).filter((invite) => matchesSearch(invite, query)),
    [data, query]
  );

  const hasNoInvitesAtAll = filter === 'all' && !isLoading && !error && (data ?? []).length === 0;

  if (hasNoInvitesAtAll) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <Mail className='h-5 w-5 text-gray-500 dark:text-neutral-400' />
        </div>
        <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
          No invites sent yet
        </p>
        <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
          Invite people by username or email and track their responses here.
        </p>
        <Button type='button' size='sm' onClick={onInvite} className='mt-4'>
          <UserPlus />
          Invite guests
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-label='Invited guests'
      className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
    >
      <div className='space-y-3 border-b border-gray-100 p-4 dark:border-neutral-800'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500' />
          <Input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search invitees...'
            aria-label='Search invited guests'
            className='h-10 rounded-xl bg-gray-50 pl-9 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500'
          />
        </div>

        <div role='tablist' aria-label='Filter invites' className='flex gap-2 overflow-x-auto'>
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
                {option.label}
                {counts ? (
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isActive
                        ? 'text-white/70 dark:text-neutral-900/60'
                        : 'text-gray-500 dark:text-neutral-400'
                    )}
                  >
                    {counts[option.countKey]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <InvitedGuestsSkeleton />
      ) : error ? (
        <div className='px-4 py-10 text-center'>
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            Couldn&apos;t load invites
          </p>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            {getErrorMessage(error) || 'Something went wrong. Please try again.'}
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => void refetch()}
            disabled={isRefetching}
            className='mt-4 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
          >
            {isRefetching ? <Loader2 className='animate-spin' /> : null}
            Try again
          </Button>
        </div>
      ) : invites.length === 0 ? (
        <div className='px-4 py-10 text-center'>
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            No invites match
          </p>
          <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
            {query || filter === 'all'
              ? 'Try a different name, username, or email.'
              : EMPTY_FILTER_COPY[filter]}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked rows */}
          <ul className='divide-y divide-gray-100 dark:divide-neutral-800 md:hidden'>
            {invites.map((invite) => (
              <li key={invite.id} className='flex items-start gap-3 px-4 py-3'>
                <InviteeAvatar invite={invite} />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                    {getInviteeLabel(invite)}
                  </p>
                  <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {[
                      getInviteeSublabel(invite),
                      invite.inviter ? `Invited by ${getPersonName(invite.inviter)}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                    <InviteBadges invite={invite} />
                    <span className='text-xs text-gray-500 dark:text-neutral-400'>
                      Sent {formatGuestDate(invite.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <table className='hidden w-full text-left text-sm md:table'>
            <thead className='border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-neutral-400'>
              <tr>
                <th scope='col' className='px-4 py-2.5 font-medium'>
                  Invitee
                </th>
                <th scope='col' className='px-4 py-2.5 font-medium'>
                  Invited by
                </th>
                <th scope='col' className='px-4 py-2.5 font-medium'>
                  Status
                </th>
                <th scope='col' className='px-4 py-2.5 text-right font-medium'>
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 dark:divide-neutral-800'>
              {invites.map((invite) => {
                const sublabel = getInviteeSublabel(invite);

                return (
                  <tr key={invite.id}>
                    <td className='px-4 py-3'>
                      <div className='flex min-w-0 items-center gap-3'>
                        <InviteeAvatar invite={invite} />
                        <div className='min-w-0 max-w-[18rem]'>
                          <p className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                            {getInviteeLabel(invite)}
                          </p>
                          {sublabel ? (
                            <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                              {sublabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {invite.inviter ? (
                        <div className='flex min-w-0 items-center gap-2'>
                          <UserAvatar
                            size='sm'
                            className='shrink-0'
                            user={{
                              name: invite.inviter.name ?? undefined,
                              username: invite.inviter.username ?? undefined,
                              image: invite.inviter.image,
                            }}
                          />
                          <span className='max-w-[12rem] truncate text-gray-700 dark:text-neutral-300'>
                            {getPersonName(invite.inviter)}
                          </span>
                        </div>
                      ) : (
                        <span className='text-gray-400 dark:text-neutral-500'>—</span>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap items-center gap-1.5'>
                        <InviteBadges invite={invite} />
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-4 py-3 text-right text-gray-500 dark:text-neutral-400'>
                      {formatGuestDate(invite.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function InviteeAvatar({ invite }: { invite: EventInviteRecord }) {
  if (!invite.invitee) {
    return (
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
        <Mail className='h-4 w-4 text-gray-500 dark:text-neutral-400' />
      </span>
    );
  }

  return (
    <UserAvatar
      size='base'
      className='shrink-0'
      user={{
        name: invite.invitee.name ?? undefined,
        username: invite.invitee.username ?? undefined,
        image: invite.invitee.image,
      }}
    />
  );
}

function InviteBadges({ invite }: { invite: EventInviteRecord }) {
  const status = STATUS_BADGES[invite.status];
  const response = invite.response ? RESPONSE_BADGES[invite.response] : null;

  return (
    <>
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
        {status.label}
      </span>
      {response ? (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', response.className)}>
          {response.label}
        </span>
      ) : null}
    </>
  );
}

function InvitedGuestsSkeleton() {
  return (
    <div aria-busy='true' aria-label='Loading invites'>
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
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
      ))}
    </div>
  );
}
