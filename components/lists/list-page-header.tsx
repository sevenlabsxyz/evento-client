import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface ListPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Desktop-only back link; mobile uses the top bar's back button. */
  backLink?: { href: string; label: string };
}

/** Editorial header (red eyebrow, bold title, muted copy) shared by the lists pages. */
export function ListPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  backLink,
}: ListPageHeaderProps) {
  return (
    <header className='flex flex-col gap-5 border-b border-gray-200 pb-8 dark:border-neutral-800 md:flex-row md:items-end md:justify-between md:gap-8'>
      <div className='min-w-0 max-w-2xl'>
        {backLink && (
          <Link
            href={backLink.href}
            className='-ml-1 mb-4 hidden w-fit items-center gap-1 rounded-full px-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-neutral-400 dark:hover:text-neutral-100 md:flex'
          >
            <ChevronLeft className='h-4 w-4' aria-hidden='true' />
            {backLink.label}
          </Link>
        )}
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {eyebrow}
        </p>
        <h1 className='mt-2 text-balance break-words text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-4xl'>
          {title}
        </h1>
        {description && (
          <p className='mt-3 text-base text-gray-600 dark:text-neutral-400'>{description}</p>
        )}
        {meta && <div className='mt-3 text-sm text-gray-500 dark:text-neutral-500'>{meta}</div>}
      </div>
      {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
    </header>
  );
}
