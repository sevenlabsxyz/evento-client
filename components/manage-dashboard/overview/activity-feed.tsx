'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import type { EventDashboard, EventDashboardActivity } from '@/lib/types/manage';
import { getRelativeTime } from '@/lib/utils/date';
import { Activity } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface ActivityFeedProps {
  dashboard: EventDashboard;
}

type ActivityMessageKey =
  | 'rsvpYes'
  | 'rsvpMaybe'
  | 'rsvpNo'
  | 'rsvpUpdated'
  | 'registrationPending'
  | 'registrationApproved'
  | 'registrationDenied'
  | 'registered'
  | 'ticket'
  | 'comment'
  | 'photo'
  | 'pledgedSats'
  | 'pledged'
  | 'inviteYes'
  | 'inviteMaybe'
  | 'inviteNo'
  | 'inviteResponded';

const RSVP_KEYS: Record<string, ActivityMessageKey> = {
  yes: 'rsvpYes',
  maybe: 'rsvpMaybe',
  no: 'rsvpNo',
};

const REGISTRATION_KEYS: Record<string, ActivityMessageKey> = {
  pending: 'registrationPending',
  approved: 'registrationApproved',
  denied: 'registrationDenied',
};

const INVITE_RESPONSE_KEYS: Record<string, ActivityMessageKey> = {
  yes: 'inviteYes',
  maybe: 'inviteMaybe',
  no: 'inviteNo',
};

function describeActivity(activity: EventDashboardActivity): {
  key: ActivityMessageKey;
  sats?: number;
  detail?: string;
} {
  const detail = activity.detail;
  switch (activity.type) {
    case 'rsvp':
      return { key: (detail && RSVP_KEYS[detail]) || 'rsvpUpdated' };
    case 'registration':
      return { key: (detail && REGISTRATION_KEYS[detail]) || 'registered' };
    case 'ticket':
      return { key: 'ticket', detail: detail ?? undefined };
    case 'comment':
      return { key: 'comment', detail: detail ?? undefined };
    case 'photo':
      return { key: 'photo' };
    case 'pledge': {
      const sats = detail ? Number(detail) : NaN;
      return Number.isFinite(sats) ? { key: 'pledgedSats', sats } : { key: 'pledged' };
    }
    case 'invite_response':
      return { key: (detail && INVITE_RESPONSE_KEYS[detail]) || 'inviteResponded' };
  }
}

const ACTIVITY_PATHS: Record<EventDashboardActivity['type'], string> = {
  rsvp: '/guests',
  registration: '/registration/submissions',
  ticket: '/check-in',
  comment: '/moderation',
  photo: '/moderation',
  pledge: '/crowdfunding',
  invite_response: '/guests?tab=invited',
};

export function ActivityFeed({ dashboard }: ActivityFeedProps) {
  const t = useTranslations('manage');
  const locale = useLocale();
  const base = `/e/${dashboard.event.id}/manage`;
  const activities = dashboard.recentActivity;

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <h2 className='mb-3 text-base font-semibold text-gray-900 dark:text-neutral-100'>
        {t('activityFeed.title')}
      </h2>

      {activities.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-neutral-800'>
          <Activity className='mb-2 h-6 w-6 text-gray-400 dark:text-neutral-500' />
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            {t('activityFeed.emptyTitle')}
          </p>
          <p className='mt-1 text-xs text-gray-500 dark:text-neutral-400'>
            {t('activityFeed.emptyDescription')}
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 dark:divide-neutral-800'>
          {activities.map((activity) => {
            const { key, sats, detail } = describeActivity(activity);
            const actorName =
              activity.actor?.name || activity.actor?.username || t('activityFeed.someone');
            return (
              <li key={activity.id}>
                <Link
                  href={`${base}${ACTIVITY_PATHS[activity.type]}`}
                  className='-mx-2 flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'
                >
                  <UserAvatar
                    size='sm'
                    user={{
                      name: activity.actor?.name ?? undefined,
                      username: activity.actor?.username ?? undefined,
                      image: activity.actor?.image,
                    }}
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm text-gray-700 dark:text-neutral-300'>
                      {t.rich(`activityFeed.actions.${key}`, {
                        name: actorName,
                        sats: sats?.toLocaleString(getIntlLocale(locale)) ?? '',
                        actor: (chunks: ReactNode) => (
                          <span className='font-medium text-gray-900 dark:text-neutral-100'>
                            {chunks}
                          </span>
                        ),
                      })}
                    </p>
                    {detail && (
                      <p className='mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-neutral-400'>
                        {detail}
                      </p>
                    )}
                  </div>
                  <span className='shrink-0 text-xs text-gray-400 dark:text-neutral-500'>
                    {getRelativeTime(activity.createdAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <Skeleton className='h-5 w-32' />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-3 w-32' />
          </div>
          <Skeleton className='h-3 w-8' />
        </div>
      ))}
    </div>
  );
}
