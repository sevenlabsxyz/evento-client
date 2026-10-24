import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface McpSectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  /** Right-aligned slot on wide screens, e.g. a docs link. */
  action?: ReactNode;
  className?: string;
}

export function McpSectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
}: McpSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-8',
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
        {description && (
          <p className='mt-2 text-base text-gray-600 dark:text-neutral-400'>{description}</p>
        )}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </div>
  );
}

interface McpDocsLinkProps {
  href: string;
  children: ReactNode;
}

/** Quiet external link to a docs page, used in section headers and cards. */
export function McpDocsLink({ href, children }: McpDocsLinkProps) {
  const t = useTranslations('developers.mcp');

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='inline-flex items-center gap-1 rounded-full text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-neutral-400 dark:hover:text-neutral-100'
    >
      {children}
      <span aria-hidden='true'>↗</span>
      <span className='sr-only'>{t('opensInNewTab')}</span>
    </a>
  );
}
