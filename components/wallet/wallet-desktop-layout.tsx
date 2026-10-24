'use client';

import { cn } from '@/lib/utils';
import { KeyRound, Lock, type LucideIcon, ShieldCheck, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useSyncExternalStore } from 'react';

/** Matches Tailwind's `md` breakpoint — the point where the top bar is hidden via `desktopHidden`. */
const WALLET_DESKTOP_QUERY = '(min-width: 768px)';

function subscribeToDesktopQuery(onChange: () => void) {
  const mql = window.matchMedia(WALLET_DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(WALLET_DESKTOP_QUERY).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

/**
 * True at `md` and up. Defaults to `false` on the server and during hydration so the
 * mobile tree is always the first (and on phones, the only) tree rendered.
 */
export function useWalletDesktopLayout() {
  return useSyncExternalStore(
    subscribeToDesktopQuery,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
}

interface WalletDesktopPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function WalletDesktopPageHeader({
  title,
  description,
  actions,
  className,
}: WalletDesktopPageHeaderProps) {
  const t = useTranslations('wallet');
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className='min-w-0'>
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {t('desktop.eyebrow')}
        </p>
        <h1 className='mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100'>
          {title}
        </h1>
        {description && (
          <p className='mt-2 text-base text-gray-600 dark:text-neutral-400'>{description}</p>
        )}
      </div>
      {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
    </header>
  );
}

interface WalletDesktopCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}

export function WalletDesktopCard({
  title,
  actions,
  children,
  bodyClassName,
}: WalletDesktopCardProps) {
  return (
    <section className='rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-center justify-between gap-3 px-5 pt-5'>
        <h2 className='min-w-0 text-base font-semibold text-gray-900 dark:text-neutral-100'>
          {title}
        </h2>
        {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export type WalletPreWalletStep = 'welcome' | 'setup' | 'restore' | 'backup' | 'unlock';

const selfCustodyPoints = [
  { icon: ShieldCheck, key: 'selfCustodial' },
  { icon: Zap, key: 'lightningAddress' },
  { icon: Lock, key: 'pinProtected' },
  { icon: KeyRound, key: 'recoverable' },
] as const satisfies readonly { icon: LucideIcon; key: string }[];

interface WalletPreWalletShellProps {
  step: WalletPreWalletStep;
  children: ReactNode;
}

/** Desktop-only frame for the welcome / setup / restore / backup / unlock flows. */
export function WalletPreWalletShell({ step, children }: WalletPreWalletShellProps) {
  const t = useTranslations('wallet');

  return (
    <div className='min-h-screen bg-white dark:bg-neutral-900'>
      <div className='mx-auto grid w-full max-w-6xl gap-10 px-8 py-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-16 lg:py-16'>
        <div className='mx-auto max-w-md text-center lg:mx-0 lg:max-w-lg lg:text-left'>
          <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
            {t('desktop.eyebrow')}
          </p>
          <h1 className='mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 lg:text-4xl'>
            {t(`desktop.preWallet.${step}.title`)}
          </h1>
          <p className='mt-3 text-base text-gray-600 dark:text-neutral-400'>
            {t(`desktop.preWallet.${step}.description`)}
          </p>

          <ul className='mt-10 hidden gap-6 lg:grid'>
            {selfCustodyPoints.map(({ icon: Icon, key }) => (
              <li key={key} className='flex items-start gap-4'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-800'>
                  <Icon className='h-5 w-5 text-gray-700 dark:text-neutral-300' />
                </span>
                <div className='min-w-0'>
                  <p className='font-semibold text-gray-900 dark:text-neutral-100'>
                    {t(`desktop.points.${key}.title`)}
                  </p>
                  <p className='mt-0.5 text-sm text-gray-600 dark:text-neutral-400'>
                    {t(`desktop.points.${key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className='mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none'>
          {children}
        </div>
      </div>
    </div>
  );
}
