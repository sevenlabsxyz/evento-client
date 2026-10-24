'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import type { EventRSVP, RSVPStatus, UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { Loader2, Users, X } from 'lucide-react';
import Link from 'next/link';
import { formatGuestDate } from './format-guest-date';

export type GuestRole = 'creator' | 'cohost' | null;

const STATUS_BADGES: Record<RSVPStatus, { label: string; className: string }> = {
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
    className: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
  },
};

const EMPTY_TAB_COPY: Record<RSVPStatus, string> = {
  yes: "No guests have confirmed they're going yet.",
  no: 'No guests have declined yet.',
  maybe: 'No guests have responded with maybe yet.',
};

interface RsvpGuestListProps {
  eventId: string;
  guests: EventRSVP[];
  activeTab: RSVPStatus;
  hasSearchQuery: boolean;
  removingUserId: string | null;
  getGuestRole: (userId: string) => GuestRole;
  onRemove: (guest: EventRSVP) => void;
  onSelectUser: (user: UserDetails | null) => void;
}

export function RsvpGuestList({
  eventId,
  guests,
  activeTab,
  hasSearchQuery,
  removingUserId,
  getGuestRole,
  onRemove,
  onSelectUser,
}: RsvpGuestListProps) {
  if (guests.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <Users className='h-6 w-6 text-gray-400 dark:text-neutral-400' />
        </div>
        <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
          {hasSearchQuery ? 'No guests match' : 'No Guests'}
        </h3>
        <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
          {hasSearchQuery ? 'Try a different name, username, or email.' : EMPTY_TAB_COPY[activeTab]}
        </p>
      </div>
    );
  }

  const hostsHref = `/e/${eventId}/manage/hosts`;

  const renderAction = (guest: EventRSVP, guestRole: GuestRole, layout: 'card' | 'table') => {
    if (activeTab !== 'yes') return null;

    if (guestRole) {
      return (
        <div className='flex flex-col items-end gap-1'>
          {layout === 'card' ? (
            <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'>
              {guestRole === 'creator' ? 'Creator' : 'Co-host'}
            </span>
          ) : null}
          <Link
            href={hostsHref}
            className='text-[11px] text-gray-500 underline-offset-2 hover:underline dark:text-neutral-400'
          >
            Manage in Hosts
          </Link>
        </div>
      );
    }

    const displayName = guest.user_details?.name || guest.user_details?.username || 'guest';
    const isRemoving = removingUserId === guest.user_id;

    return (
      <button
        type='button'
        onClick={() => onRemove(guest)}
        disabled={isRemoving}
        className={cn(
          'flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-red-400',
          layout === 'card' ? 'h-8 w-8' : 'ml-auto h-8 gap-1.5 px-3 text-sm font-medium'
        )}
        aria-label={`Remove ${displayName}`}
      >
        {isRemoving ? <Loader2 className='h-4 w-4 animate-spin' /> : <X className='h-4 w-4' />}
        {layout === 'table' ? <span>Remove</span> : null}
      </button>
    );
  };

  return (
    <>
      {/* Mobile: card rows */}
      <ul className='space-y-3 md:hidden'>
        {guests.map((guest) => {
          const guestRole = getGuestRole(guest.user_id);
          const rsvpDate = formatGuestDate(guest.updated_at || guest.created_at);

          return (
            <li
              key={guest.id}
              className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-900'
            >
              <UserAvatar
                user={{
                  name: guest.user_details?.name,
                  username: guest.user_details?.username,
                  image: guest.user_details?.image,
                  verification_status: guest.user_details?.verification_status,
                }}
                onAvatarClick={() => onSelectUser(guest.user_details || null)}
                height={48}
                width={48}
              />
              <div className='min-w-0 flex-1'>
                <h3 className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                  {guest.user_details?.name}
                </h3>
                <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                  {guest.user_details?.username}
                </p>
                {rsvpDate ? (
                  <p className='mt-0.5 text-xs text-gray-400 dark:text-neutral-500'>
                    RSVP&apos;d {rsvpDate}
                  </p>
                ) : null}
              </div>
              {renderAction(guest, guestRole, 'card')}
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className='hidden overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block'>
        <table className='w-full text-left text-sm'>
          <thead className='border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:text-neutral-400'>
            <tr>
              <th scope='col' className='px-4 py-2.5 font-medium'>
                Guest
              </th>
              <th scope='col' className='px-4 py-2.5 font-medium'>
                Status
              </th>
              <th scope='col' className='px-4 py-2.5 font-medium'>
                RSVP date
              </th>
              <th scope='col' className='px-4 py-2.5 text-right font-medium'>
                <span className='sr-only'>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100 dark:divide-neutral-800'>
            {guests.map((guest) => {
              const guestRole = getGuestRole(guest.user_id);
              const status = STATUS_BADGES[guest.status];

              return (
                <tr key={guest.id}>
                  <td className='px-4 py-3'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <UserAvatar
                        size='base'
                        className='shrink-0'
                        user={{
                          name: guest.user_details?.name,
                          username: guest.user_details?.username,
                          image: guest.user_details?.image,
                          verification_status: guest.user_details?.verification_status,
                        }}
                        onAvatarClick={() => onSelectUser(guest.user_details || null)}
                      />
                      <div className='min-w-0 max-w-[20rem]'>
                        <p className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                          {guest.user_details?.name}
                        </p>
                        <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                          {guest.user_details?.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap items-center gap-1.5'>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                      {guestRole ? (
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'>
                          {guestRole === 'creator' ? 'Creator' : 'Co-host'}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-gray-500 dark:text-neutral-400'>
                    {formatGuestDate(guest.updated_at || guest.created_at) || '—'}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    {renderAction(guest, guestRole, 'table')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
