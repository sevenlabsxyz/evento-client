'use client';

import {
  SECURITY_CONTACT_EMAIL,
  SECURITY_REPORT_MAILTO,
  type SecuritySectionContent,
} from '@/components/security/security-content';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

/**
 * Tracks the section the reader is in: the first section whose top edge sits
 * in the upper band of the viewport, else the last one scrolled past.
 */
function useActiveSectionId(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') {
      setActiveId(null);
      return;
    }

    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const firstVisible = elements.find((element) => visibleIds.has(element.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
          return;
        }

        const passed = elements.filter((element) => element.getBoundingClientRect().top < 0);
        setActiveId(passed.length > 0 ? passed[passed.length - 1].id : null);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

interface SecuritySectionNavProps {
  sections: SecuritySectionContent[];
  className?: string;
}

export function SecuritySectionNav({ sections, className }: SecuritySectionNavProps) {
  const t = useTranslations('security');
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const activeId = useActiveSectionId(sectionIds);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <nav aria-label={t('nav.onThisPage')} className='text-sm'>
        <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500'>
          {t('nav.onThisPage')}
        </p>
        <ol className='space-y-0.5 border-l border-gray-200 dark:border-neutral-800'>
          {sections.map((section) => {
            const isActive = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => handleClick(event, section.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    '-ml-px block border-l-2 py-1.5 pl-4 pr-2 leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 motion-safe:transition-colors',
                    isActive
                      ? 'border-red-600 font-medium text-gray-900 dark:border-red-400 dark:text-neutral-100'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100'
                  )}
                >
                  {t(`sections.${section.key}.navLabel`)}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-800'>
        <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
          {t('nav.foundIssue')}
        </p>
        <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
          {t.rich('nav.reportPrivately', {
            email: SECURITY_CONTACT_EMAIL,
            link: (chunks) => (
              <a
                href={SECURITY_REPORT_MAILTO}
                className='break-all font-medium text-red-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-red-400'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
