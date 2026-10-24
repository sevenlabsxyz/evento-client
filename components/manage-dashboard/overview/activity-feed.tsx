'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { EventDashboard, EventDashboardActivity } from '@/lib/types/manage';
import { getRelativeTime } from '@/lib/utils/date';
import { Activity } from 'lucide-react';
import Link from 'next/link';

interface ActivityFeedProps {
  dashboard: EventDashboard;
}

const RSVP_VERBS: Record<string, string> = {
  yes: 'is going',
  maybe: 'might go',
  no: "can't go",
};

const REGISTRATION_VERBS: Record<string, string> = {
  pending: 'registered and is awaiting approval',
  approved: 'registered and was approved',
  denied: 'registered and was denied',
};

const INVITE_RESPONSE_VERBS: Record<string, string> = {
  yes: 'accepted an invite',
  maybe: 'replied maybe to an invite',
  no: 'declined an invite',
};

function describeActivity(activity: EventDashboardActivity): { verb: string; detail?: string } {
  const detail = activity.detail;
  switch (activity.type) {
    case 'rsvp':
      return { verb: (detail && RSVP_VERBS[detail]) || 'updated their RSVP' };
    case 'registration':
      return { verb: (detail && REGISTRATION_VERBS[detail]) || 'registered' };
    case 'ticket':
      return { verb: 'got a ticket', detail: detail ?? undefined };
    case 'comment':
      return { verb: 'commented', detail: detail ?? undefined };
    case 'photo':
      return { verb: 'added a photo' };
    case 'pledge': {
      const sats = detail ? Number(detail) : NaN;
      return {
        verb: Number.isFinite(sats) ? `pledged ${sats.toLocaleString()} sats` : 'pledged',
      };
    }
    case 'invite_response':
      return { verb: (detail && INVITE_RESPONSE_VERBS[detail]) || 'responded to an invite' };
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
  const base = `/e/${dashboard.event.id}/manage`;
  const activities = dashboard.recentActivity;

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <h2 className='mb-3 text-base font-semibold text-gray-900 dark:text-neutral-100'>
        Recent activity
      </h2>

      {activities.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-neutral-800'>
          <Activity className='mb-2 h-6 w-6 text-gray-400 dark:text-neutral-500' />
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>No activity yet</p>
          <p className='mt-1 text-xs text-gray-500 dark:text-neutral-400'>
            RSVPs, comments and more will appear here.
          </p>
        </div>
      ) : (
        <ul className='divide-y divide-gray-100 dark:divide-neutral-800'>
          {activities.map((activity) => {
            const { verb, detail } = describeActivity(activity);
            const actorName = activity.actor?.name || activity.actor?.username || 'Someone';
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
                      <span className='font-medium text-gray-900 dark:text-neutral-100'>
                        {actorName}
                      </span>{' '}
                      {verb}
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
