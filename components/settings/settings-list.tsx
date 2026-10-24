import { cn } from '@/lib/utils';
import { ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useId } from 'react';

type SettingsRowTone = 'default' | 'telegram' | 'danger';

const ICON_TILE_TONE_CLASS: Record<SettingsRowTone, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300',
  telegram: 'bg-[#EEF7FD] text-[#2AABEE] dark:bg-[#2AABEE]/15',
  danger: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
};

const LABEL_TONE_CLASS: Record<SettingsRowTone, string> = {
  default: 'text-gray-900 dark:text-neutral-100',
  telegram: 'text-gray-900 dark:text-neutral-100',
  danger: 'text-red-600 dark:text-red-400',
};

/** Shared interactive row styling (buttons, links, and menu triggers). */
export const SETTINGS_ROW_INTERACTIVE_CLASS =
  'block w-full text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-neutral-800/60 dark:focus-visible:bg-neutral-800/60';

const TRAILING_ICON_CLASS = 'h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

/** Titled card that groups related settings rows. */
export function SettingsSection({ title, children, tone = 'default' }: SettingsSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className={cn(
          'mb-3 px-1 text-xs font-semibold uppercase tracking-wider',
          tone === 'danger'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-500 dark:text-neutral-400'
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          'divide-y overflow-hidden rounded-2xl border bg-white dark:bg-neutral-900',
          tone === 'danger'
            ? 'divide-red-100 border-red-200 dark:divide-red-950/60 dark:border-red-900/60'
            : 'divide-gray-100 border-gray-200 dark:divide-neutral-800 dark:border-neutral-800'
        )}
      >
        {children}
      </div>
    </section>
  );
}

interface SettingsRowContentProps {
  icon: LucideIcon;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  tone?: SettingsRowTone;
}

/** Row layout: icon tile, label + description, and a trailing value/control. */
export function SettingsRowContent({
  icon: Icon,
  label,
  description,
  trailing,
  tone = 'default',
}: SettingsRowContentProps) {
  return (
    <span className='flex min-h-[4rem] items-center gap-4 px-4 py-3'>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          ICON_TILE_TONE_CLASS[tone]
        )}
      >
        <Icon className='h-[18px] w-[18px]' aria-hidden='true' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className={cn('block text-sm font-medium', LABEL_TONE_CLASS[tone])}>{label}</span>
        {description && (
          <span className='mt-0.5 block text-sm text-gray-500 dark:text-neutral-400'>
            {description}
          </span>
        )}
      </span>
      {trailing && <span className='flex shrink-0 items-center gap-2'>{trailing}</span>}
    </span>
  );
}

export function SettingsChevron() {
  return <ChevronRight className={TRAILING_ICON_CLASS} aria-hidden='true' />;
}

type SettingsRowProps = SettingsRowContentProps &
  (
    | { href: string; external?: boolean; externalLabel?: string; onClick?: never }
    | { onClick: () => void; href?: never; external?: never; externalLabel?: never }
    | { href?: never; onClick?: never; external?: never; externalLabel?: never }
  );

/**
 * A settings row rendered as an internal link, external link, button, or static
 * container (for rows whose trailing slot holds their own control). Interactive
 * rows show a chevron unless a custom trailing element is given.
 */
export function SettingsRow({
  href,
  external,
  externalLabel,
  onClick,
  trailing,
  ...contentProps
}: SettingsRowProps) {
  if (href && external) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={SETTINGS_ROW_INTERACTIVE_CLASS}
      >
        <SettingsRowContent
          {...contentProps}
          trailing={
            trailing ?? (
              <>
                {externalLabel && <span className='sr-only'>{externalLabel}</span>}
                <ArrowUpRight className={TRAILING_ICON_CLASS} aria-hidden='true' />
              </>
            )
          }
        />
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={SETTINGS_ROW_INTERACTIVE_CLASS}>
        <SettingsRowContent {...contentProps} trailing={trailing ?? <SettingsChevron />} />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type='button' onClick={onClick} className={SETTINGS_ROW_INTERACTIVE_CLASS}>
        <SettingsRowContent {...contentProps} trailing={trailing ?? <SettingsChevron />} />
      </button>
    );
  }

  return (
    <div>
      <SettingsRowContent {...contentProps} trailing={trailing} />
    </div>
  );
}
