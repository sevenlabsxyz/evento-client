'use client';

import { DEFAULT_AVATAR_IMAGE } from '@/lib/constants/avatar';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserFollowingCount } from '@/lib/hooks/use-user-profile';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CalendarPlus,
  Check,
  LucideIcon,
  UserPlus,
  UserRoundPen,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

interface GetStartedCardProps {
  viewer: UserDetails | null;
}

interface GetStartedStep {
  id: 'create' | 'follow' | 'wallet' | 'profile';
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  done: boolean;
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function getHasStoredWalletSeed(): boolean {
  return !!WalletStorageService.getEncryptedSeed();
}

function getServerHasStoredWalletSeed(): null {
  return null;
}

export function GetStartedCard({ viewer }: GetStartedCardProps) {
  const hasViewer = !!viewer;

  const hostingQuery = useUserEvents({ filter: 'hosting', limit: 1, enabled: hasViewer });
  const draftsQuery = useMyDraftEvents({ limit: 1, enabled: hasViewer });
  const followingCountQuery = useUserFollowingCount(viewer?.id ?? '');

  // A wallet "exists" once it is set up on this device, whether or not it is
  // currently unlocked. The store reports initialized wallets (locked or
  // connected); the stored encrypted seed answers immediately without waiting
  // for the wallet SDK to connect.
  const isWalletInitialized = useWalletStore((state) => state.walletState.isInitialized);
  const hasStoredWalletSeed = useSyncExternalStore(
    subscribeToStorage,
    getHasStoredWalletSeed,
    getServerHasStoredWalletSeed
  );

  if (!viewer) {
    return null;
  }

  const isLoading =
    hostingQuery.isPending ||
    draftsQuery.isPending ||
    followingCountQuery.isPending ||
    hasStoredWalletSeed === null;

  // Hide while loading (no flash of incomplete steps) and on errors (never
  // nudge an existing host to "create your first event" due to a failed fetch).
  if (isLoading || hostingQuery.isError || draftsQuery.isError || followingCountQuery.isError) {
    return null;
  }

  const hostingCount =
    hostingQuery.data?.pages[0]?.pagination?.totalCount ??
    hostingQuery.data?.pages[0]?.events.length ??
    0;
  const draftsCount =
    draftsQuery.data?.pages[0]?.pagination?.totalCount ??
    draftsQuery.data?.pages[0]?.events.length ??
    0;

  const avatar = viewer.image?.trim();
  const hasCustomAvatar = !!avatar && !avatar.endsWith(DEFAULT_AVATAR_IMAGE);

  const steps: GetStartedStep[] = [
    {
      id: 'create',
      title: 'Create your first event',
      description: 'Host a meetup, party or class',
      href: '/e/create',
      icon: CalendarPlus,
      done: hostingCount > 0 || draftsCount > 0,
    },
    {
      id: 'follow',
      title: 'Follow hosts',
      description: 'See their events in your feed',
      href: '/e/search',
      icon: UserPlus,
      done: (followingCountQuery.data ?? 0) > 0,
    },
    {
      id: 'wallet',
      title: 'Set up your wallet',
      description: 'Send and receive sats',
      href: '/e/wallet',
      icon: Wallet,
      done: isWalletInitialized || hasStoredWalletSeed === true,
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add a photo and a bio',
      href: '/e/profile/edit',
      icon: UserRoundPen,
      done: !!viewer.bio?.trim() && hasCustomAvatar,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;

  if (completedCount === steps.length) {
    return null;
  }

  return (
    <section
      aria-labelledby='get-started-title'
      className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950 md:p-5'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h2
            id='get-started-title'
            className='text-base font-semibold text-gray-900 dark:text-neutral-100'
          >
            Get started
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            A few steps to make Evento yours
          </p>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1.5 pt-0.5'>
          <span className='text-xs font-medium tabular-nums text-gray-600 dark:text-neutral-300'>
            {completedCount} of {steps.length}
          </span>
          <div
            role='progressbar'
            aria-label='Get started progress'
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completedCount}
            className='h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800'
          >
            <div
              className='h-full rounded-full bg-gray-900 transition-[width] duration-500 ease-out dark:bg-neutral-100'
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <ul className='mt-4 grid grid-cols-2 gap-2 2xl:grid-cols-4'>
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <li key={step.id} className='min-w-0'>
              <Link
                href={step.href}
                aria-label={step.done ? `${step.title} (completed)` : step.title}
                className={cn(
                  'group flex h-full flex-col gap-3 rounded-xl border p-3 transition-colors',
                  step.done
                    ? 'border-gray-200/70 bg-transparent dark:border-neutral-800/70'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
                )}
              >
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      step.done
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-200'
                    )}
                  >
                    {step.done ? (
                      <Check className='h-4 w-4' strokeWidth={2.5} />
                    ) : (
                      <Icon className='h-4 w-4' />
                    )}
                  </span>
                  {!step.done && (
                    <ArrowRight className='h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-neutral-600 dark:group-hover:text-neutral-400' />
                  )}
                </div>
                <div className='min-w-0'>
                  <p
                    className={cn(
                      'text-sm font-medium leading-snug',
                      step.done
                        ? 'text-gray-400 line-through decoration-gray-300 dark:text-neutral-500 dark:decoration-neutral-600'
                        : 'text-gray-900 dark:text-neutral-100'
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs leading-snug',
                      step.done
                        ? 'text-gray-400 dark:text-neutral-600'
                        : 'text-gray-500 dark:text-neutral-400'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
