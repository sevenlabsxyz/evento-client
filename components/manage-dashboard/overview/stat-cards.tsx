'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import {
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Mail,
  MessageSquare,
  ScanLine,
  Ticket,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

interface StatCardsProps {
  dashboard: EventDashboard;
}

interface StatItem {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  progress?: number;
}

const numberFormatter = new Intl.NumberFormat();

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function buildStats(dashboard: EventDashboard): StatItem[] {
  const base = `/e/${dashboard.event.id}/manage`;
  const { rsvps, capacity, registration, tickets, invites, campaign, engagement } = dashboard;
  const stats: StatItem[] = [];

  stats.push({
    id: 'going',
    label: 'Going',
    value: capacity.max
      ? `${formatNumber(rsvps.yes)} / ${formatNumber(capacity.max)}`
      : formatNumber(rsvps.yes),
    sublabel: capacity.max
      ? capacity.isFull
        ? 'At capacity'
        : `${formatNumber(capacity.remaining ?? 0)} spots left`
      : undefined,
    href: `${base}/guests`,
    icon: CircleCheck,
    iconClassName: 'bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400',
    progress: capacity.max ? toPercent(rsvps.yes, capacity.max) : undefined,
  });

  stats.push({
    id: 'maybe',
    label: 'Maybe',
    value: formatNumber(rsvps.maybe),
    href: `${base}/guests`,
    icon: CircleHelp,
    iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
  });

  stats.push({
    id: 'not-going',
    label: 'Not going',
    value: formatNumber(rsvps.no),
    href: `${base}/guests`,
    icon: CircleX,
    iconClassName: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
  });

  if (registration) {
    stats.push({
      id: 'pending-approvals',
      label: 'Pending approvals',
      value: formatNumber(registration.pending),
      sublabel: `${formatNumber(registration.approved)} approved · ${formatNumber(
        registration.denied
      )} denied`,
      href: `${base}/registration/submissions`,
      icon: ClipboardList,
      iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    });
  }

  if (tickets) {
    stats.push({
      id: 'tickets-sold',
      label: 'Tickets sold',
      value: `${formatNumber(tickets.sold)} / ${formatNumber(tickets.capacity)}`,
      sublabel: `${formatNumber(tickets.revenueSats)} sats revenue`,
      href: `${base}/sales`,
      icon: Ticket,
      iconClassName: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      progress: tickets.capacity > 0 ? toPercent(tickets.sold, tickets.capacity) : undefined,
    });

    stats.push({
      id: 'checked-in',
      label: 'Checked in',
      value: `${formatNumber(tickets.checkedIn)} / ${formatNumber(tickets.issued)}`,
      href: `${base}/check-in`,
      icon: ScanLine,
      iconClassName: 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
      progress: tickets.issued > 0 ? toPercent(tickets.checkedIn, tickets.issued) : undefined,
    });
  }

  stats.push({
    id: 'invites',
    label: 'Invites going',
    value: `${formatNumber(invites.going)} / ${formatNumber(invites.total)}`,
    sublabel: `${formatNumber(invites.pending)} awaiting response`,
    href: `${base}/guests?tab=invited`,
    icon: Mail,
    iconClassName: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400',
  });

  if (campaign) {
    stats.push({
      id: 'campaign',
      label: 'Raised',
      value: campaign.goalSats
        ? `${formatNumber(campaign.raisedSats)} / ${formatNumber(campaign.goalSats)}`
        : formatNumber(campaign.raisedSats),
      sublabel: `sats · ${formatNumber(campaign.pledgeCount)} ${
        campaign.pledgeCount === 1 ? 'pledge' : 'pledges'
      }`,
      href: `${base}/crowdfunding`,
      icon: Zap,
      iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      progress: campaign.goalSats ? Math.min(100, campaign.progressPercent) : undefined,
    });
  }

  stats.push({
    id: 'engagement',
    label: 'Engagement',
    value: formatNumber(engagement.comments + engagement.photos),
    sublabel: `${formatNumber(engagement.comments)} comments · ${formatNumber(
      engagement.photos
    )} photos`,
    href: `${base}/moderation`,
    icon: MessageSquare,
    iconClassName: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
  });

  return stats;
}

export function StatCards({ dashboard }: StatCardsProps) {
  const stats = buildStats(dashboard);

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.id}
            href={stat.href}
            className='group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
          >
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  stat.iconClassName
                )}
              >
                <Icon className='h-4 w-4' />
              </div>
              <span className='truncate text-sm font-medium text-gray-600 dark:text-neutral-400'>
                {stat.label}
              </span>
            </div>
            <div className='min-w-0'>
              <p className='truncate text-2xl font-semibold tabular-nums text-gray-900 dark:text-neutral-100'>
                {stat.value}
              </p>
              {stat.sublabel && (
                <p className='mt-0.5 truncate text-xs text-gray-500 dark:text-neutral-400'>
                  {stat.sublabel}
                </p>
              )}
            </div>
            {stat.progress !== undefined && (
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800'>
                <div
                  className='h-full rounded-full bg-gray-900 transition-all dark:bg-neutral-100'
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className='space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
        >
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8 rounded-lg' />
            <Skeleton className='h-4 w-20' />
          </div>
          <Skeleton className='h-7 w-16' />
          <Skeleton className='h-3 w-24' />
        </div>
      ))}
    </div>
  );
}
