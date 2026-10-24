import {
  SECURITY_CONTACT_EMAIL,
  type SecurityLink,
  type SecuritySectionContent,
} from '@/components/security/security-content';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

const FOCUS_RING_CLASS =
  'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40';

function SecurityLinkAnchor({
  link,
  className,
  children,
}: {
  link: SecurityLink;
  className: string;
  children: ReactNode;
}) {
  if (link.href.startsWith('mailto:')) {
    return (
      <a href={link.href} className={className}>
        {children}
      </a>
    );
  }

  if (link.external) {
    return (
      <a href={link.href} target='_blank' rel='noopener noreferrer' className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {children}
    </Link>
  );
}

interface SecuritySectionProps {
  section: SecuritySectionContent;
}

export function SecuritySection({ section }: SecuritySectionProps) {
  const t = useTranslations('security');
  const headingId = `${section.id}-heading`;

  return (
    <section
      id={section.id}
      aria-labelledby={headingId}
      className='scroll-mt-6 border-t border-gray-200 py-8 first:border-t-0 first:pt-0 dark:border-neutral-800 md:py-10'
    >
      <h2
        id={headingId}
        className='text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100'
      >
        {t(`sections.${section.key}.title`)}
      </h2>
      <p className='mt-1 text-sm text-gray-500 dark:text-neutral-500'>
        {t(`sections.${section.key}.summary`)}
      </p>

      <ul className='mt-5 space-y-3.5'>
        {section.points.map((point) => (
          <li key={point.key} className='flex gap-3 text-[15px] leading-relaxed'>
            <span
              aria-hidden='true'
              className='mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400'
            />
            <p className='min-w-0 text-gray-600 dark:text-neutral-400'>
              <span className='font-semibold text-gray-900 dark:text-neutral-100'>
                {t(`points.${point.key}.title`)}.
              </span>{' '}
              {t(`points.${point.key}.body`, { email: SECURITY_CONTACT_EMAIL })}
              {point.link && (
                <>
                  {' '}
                  <SecurityLinkAnchor
                    link={point.link}
                    className={cn(
                      'inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-red-600 underline-offset-4 hover:underline dark:text-red-400',
                      FOCUS_RING_CLASS
                    )}
                  >
                    {t(`links.${point.link.labelKey}`)}
                    {point.link.external ? (
                      <ArrowUpRight className='h-3.5 w-3.5' aria-hidden='true' />
                    ) : (
                      <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
                    )}
                  </SecurityLinkAnchor>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>

      {section.actions && section.actions.length > 0 && (
        <div className='mt-6 flex flex-wrap gap-2.5'>
          {section.actions.map((action, index) => (
            <SecurityLinkAnchor
              key={action.href}
              link={action}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 motion-safe:transition-colors',
                index === 0
                  ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
              )}
            >
              {t(`links.${action.labelKey}`)}
            </SecurityLinkAnchor>
          ))}
        </div>
      )}
    </section>
  );
}
