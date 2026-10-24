'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import type { EventRSVP, RSVPStatus, UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { Loader2, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatGuestDate } from './format-guest-date';

export type GuestRole = 'creator' | 'cohost' | null;

const STATUS_BADGE_CLASSES: Record<RSVPStatus, string> = {
  yes: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300',
  maybe: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  no: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
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
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');

  if (guests.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          <Users className='h-6 w-6 text-gray-400 dark:text-neutral-400' />
        </div>
        <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
          {hasSearchQuery ? t('rsvpGuestList.noMatchTitle') : t('rsvpGuestList.noGuests')}
        </h3>
        <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
          {hasSearchQuery
            ? t('rsvpGuestList.noMatchBody')
            : t(`rsvpGuestList.emptyTab.${activeTab}`)}
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
              {guestRole === 'creator' ? t('rsvpGuestList.creator') : t('rsvpGuestList.cohost')}
            </span>
          ) : null}
          <Link
            href={hostsHref}
            className='text-[11px] text-gray-500 underline-offset-2 hover:underline dark:text-neutral-400'
          >
            {t('rsvpGuestList.manageInHosts')}
          </Link>
        </div>
      );
    }

    const displayName =
      guest.user_details?.name || guest.user_details?.username || t('rsvpGuestList.guestFallback');
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
        aria-label={t('rsvpGuestList.removeLabel', { name: displayName })}
      >
        {isRemoving ? <Loader2 className='h-4 w-4 animate-spin' /> : <X className='h-4 w-4' />}
        {layout === 'table' ? <span>{tCommon('actions.remove')}</span> : null}
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
                    {t('rsvpGuestList.rsvpDate', { date: rsvpDate })}
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
                {t('rsvpGuestList.columns.guest')}
              </th>
              <th scope='col' className='px-4 py-2.5 font-medium'>
                {t('rsvpGuestList.columns.status')}
              </th>
              <th scope='col' className='px-4 py-2.5 font-medium'>
                {t('rsvpGuestList.columns.rsvpDate')}
              </th>
              <th scope='col' className='px-4 py-2.5 text-right font-medium'>
                <span className='sr-only'>{t('rsvpGuestList.columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100 dark:divide-neutral-800'>
            {guests.map((guest) => {
              const guestRole = getGuestRole(guest.user_id);

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
                          STATUS_BADGE_CLASSES[guest.status]
                        )}
                      >
                        {t(`rsvpGuestList.status.${guest.status}`)}
                      </span>
                      {guestRole ? (
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'>
                          {guestRole === 'creator'
                            ? t('rsvpGuestList.creator')
                            : t('rsvpGuestList.cohost')}
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
