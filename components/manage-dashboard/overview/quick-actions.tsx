'use client';

import { useDuplicateEvent } from '@/lib/hooks/use-duplicate-event';
import type { EventDashboard } from '@/lib/types/manage';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import {
  ChevronRight,
  Copy,
  Loader2,
  Mail,
  PencilLine,
  ScanLine,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  dashboard: EventDashboard;
  onInviteGuests: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function QuickActions({ dashboard, onInviteGuests }: QuickActionsProps) {
  const router = useRouter();
  const duplicateEvent = useDuplicateEvent();
  const eventId = dashboard.event.id;
  const base = `/e/${eventId}/manage`;

  const handleDuplicate = async () => {
    try {
      const duplicated = await duplicateEvent.mutateAsync(eventId);
      toast.success('Event duplicated as a draft');
      router.push(`/e/${duplicated.id}/manage`);
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Failed to duplicate event');
    }
  };

  const actions: QuickAction[] = [
    {
      id: 'invite',
      label: 'Invite guests',
      hint: 'Send invites to people you know',
      icon: UserPlus,
      iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      onClick: onInviteGuests,
    },
    {
      id: 'email-blast',
      label: 'Send email blast',
      hint: 'Message your guests by email',
      icon: Mail,
      iconClassName: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400',
      onClick: () => router.push(`${base}/email-blast`),
    },
    ...(dashboard.tickets
      ? [
          {
            id: 'check-in',
            label: 'Check in guests',
            hint: 'Scan tickets at the door',
            icon: ScanLine,
            iconClassName: 'bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
            onClick: () => router.push(`${base}/check-in`),
          },
        ]
      : []),
    {
      id: 'edit-details',
      label: 'Edit details',
      hint: 'Update time, place and description',
      icon: PencilLine,
      iconClassName: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
      onClick: () => router.push(`${base}/details`),
    },
    {
      id: 'duplicate',
      label: duplicateEvent.isPending ? 'Duplicating…' : 'Duplicate event',
      hint: 'Copy this event as a new draft',
      icon: Copy,
      iconClassName: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      onClick: handleDuplicate,
      loading: duplicateEvent.isPending,
      disabled: duplicateEvent.isPending,
    },
  ];

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <h2 className='mb-3 text-base font-semibold text-gray-900 dark:text-neutral-100'>
        Quick actions
      </h2>
      <ul className='-mx-2 space-y-0.5'>
        {actions.map((action) => {
          const Icon = action.loading ? Loader2 : action.icon;
          return (
            <li key={action.id}>
              <button
                type='button'
                onClick={action.onClick}
                disabled={action.disabled}
                className='group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-neutral-800'
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    action.iconClassName
                  )}
                >
                  <Icon className={cn('h-4 w-4', action.loading && 'animate-spin')} />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
                    {action.label}
                  </span>
                  <span className='block truncate text-xs text-gray-500 dark:text-neutral-400'>
                    {action.hint}
                  </span>
                </span>
                <ChevronRight
                  className='h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-neutral-500'
                  aria-hidden='true'
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
