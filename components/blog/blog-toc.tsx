'use client';

import type { BlogContentHeading } from '@/components/blog/enhanced-blog-content';
import { cn } from '@/lib/utils';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

interface BlogTocProps {
  headings: BlogContentHeading[];
  className?: string;
}

/** Minimum number of headings before an outline is worth showing. */
export const BLOG_TOC_MIN_HEADINGS = 2;

/**
 * Tracks which heading the reader is currently in: the last heading whose top
 * edge has scrolled past the upper quarter of the viewport.
 */
function useActiveHeadingId(headingIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = headingIds
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

        // Nothing in the reading band: keep the last heading above it active.
        const passed = elements.filter((element) => element.getBoundingClientRect().top < 0);
        setActiveId(passed.length > 0 ? passed[passed.length - 1].id : null);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [headingIds]);

  return activeId;
}

export function BlogToc({ headings, className }: BlogTocProps) {
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

  const activeId = useActiveHeadingId(headingIds);

  if (headings.length < BLOG_TOC_MIN_HEADINGS) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav aria-label='On this page' className={cn('text-sm', className)}>
      <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500'>
        On this page
      </p>
      <ol className='space-y-0.5 border-l border-gray-200 dark:border-neutral-800'>
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(event) => handleClick(event, heading.id)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l-2 py-1.5 pr-2 leading-snug transition-colors',
                  heading.level === 3 ? 'pl-7' : 'pl-4',
                  isActive
                    ? 'border-red-600 font-medium text-gray-900 dark:border-red-400 dark:text-neutral-100'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-100'
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
