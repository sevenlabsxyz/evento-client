import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface ApiSectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ApiSectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
}: ApiSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8',
        className
      )}
    >
      <div className='min-w-0 max-w-2xl'>
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {eyebrow}
        </p>
        <h2
          id={id}
          className='mt-2 text-balance text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-3xl'
        >
          {title}
        </h2>
        <p className='mt-2 text-base text-gray-600 dark:text-neutral-400'>{description}</p>
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  );
}

export function DocsTextLink({ href, children }: { href: string; children: ReactNode }) {
  const t = useTranslations('developers.api');

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='group inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-red-400 dark:hover:text-red-300 dark:focus-visible:ring-offset-neutral-900'
    >
      {children}
      <span
        aria-hidden='true'
        className='motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5'
      >
        →
      </span>
      <span className='sr-only'>{t('opensInNewTab')}</span>
    </a>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className='rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-800 dark:bg-neutral-800 dark:text-neutral-200'>
      {children}
    </code>
  );
}
