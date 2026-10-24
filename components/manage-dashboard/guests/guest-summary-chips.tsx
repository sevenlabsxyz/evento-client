'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { CircleCheck, CircleHelp, CircleX, Mail, type LucideIcon } from 'lucide-react';

interface GuestSummaryChipsProps {
  dashboard: EventDashboard | undefined;
  isLoading: boolean;
}

interface SummaryChip {
  id: string;
  label: string;
  value: number;
  sublabel?: string;
  icon: LucideIcon;
  iconClassName: string;
}

function buildChips(dashboard: EventDashboard): SummaryChip[] {
  const { rsvps, capacity, invites } = dashboard;

  return [
    {
      id: 'going',
      label: 'Going',
      value: rsvps.yes,
      sublabel: capacity.max ? `of ${capacity.max} spots` : undefined,
      icon: CircleCheck,
      iconClassName: 'bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400',
    },
    {
      id: 'maybe',
      label: 'Maybe',
      value: rsvps.maybe,
      icon: CircleHelp,
      iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      id: 'not-going',
      label: 'Not going',
      value: rsvps.no,
      icon: CircleX,
      iconClassName: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
    },
    {
      id: 'invited',
      label: 'Invited',
      value: invites.total,
      sublabel: invites.total > 0 ? `${invites.pending} pending` : undefined,
      icon: Mail,
      iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
  ];
}

export function GuestSummaryChips({ dashboard, isLoading }: GuestSummaryChipsProps) {
  if (isLoading) {
    return (
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4' aria-busy='true'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-[60px] w-full rounded-2xl' />
        ))}
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <ul aria-label='Guest summary' className='grid grid-cols-2 gap-3 md:grid-cols-4'>
      {buildChips(dashboard).map((chip) => {
        const Icon = chip.icon;

        return (
          <li
            key={chip.id}
            className='flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900'
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                chip.iconClassName
              )}
            >
              <Icon className='h-4 w-4' />
            </span>
            <div className='min-w-0'>
              <p className='truncate text-xs font-medium text-gray-500 dark:text-neutral-400'>
                {chip.label}
              </p>
              <p className='flex items-baseline gap-1.5'>
                <span className='text-lg font-semibold tabular-nums leading-tight text-gray-900 dark:text-neutral-100'>
                  {chip.value}
                </span>
                {chip.sublabel ? (
                  <span className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {chip.sublabel}
                  </span>
                ) : null}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
