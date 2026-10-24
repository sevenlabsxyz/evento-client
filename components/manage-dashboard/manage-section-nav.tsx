'use client';

import type { ManageNavItem, ManageNavSection } from '@/components/manage-dashboard/manage-nav';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface ManageSectionNavProps {
  sections: ManageNavSection[];
  activeItemId: string | null;
  variant: 'sidebar' | 'pills';
  className?: string;
}

function NavBadge({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
        active
          ? 'bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100'
          : 'bg-red-500 text-white dark:bg-red-600'
      )}
    >
      {value > 99 ? '99+' : value}
      <span className='sr-only'> pending</span>
    </span>
  );
}

function SidebarLink({ item, active }: { item: ManageNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-neutral-500',
        active
          ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
      )}
    >
      <Icon className='h-4 w-4 shrink-0' aria-hidden='true' />
      <span className='truncate'>{item.label}</span>
      {item.badge !== undefined && <NavBadge value={item.badge} active={active} />}
    </Link>
  );
}

function PillLink({ item, active }: { item: ManageNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      data-active={active ? 'true' : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-neutral-500',
        active
          ? 'border-gray-900 bg-gray-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
      )}
    >
      <Icon className='h-4 w-4 shrink-0' aria-hidden='true' />
      {item.label}
      {item.badge !== undefined && <NavBadge value={item.badge} active={active} />}
    </Link>
  );
}

export function ManageSectionNav({
  sections,
  activeItemId,
  variant,
  className,
}: ManageSectionNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== 'pills') {
      return;
    }
    const scroller = scrollerRef.current;
    const activeLink = scroller?.querySelector<HTMLElement>('[data-active="true"]');
    if (!scroller || !activeLink) {
      return;
    }
    const target = activeLink.offsetLeft - scroller.clientWidth / 2 + activeLink.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [variant, activeItemId]);

  if (variant === 'pills') {
    const items = sections.flatMap((section) => section.items);

    return (
      <nav aria-label='Event management' className={className}>
        <div
          ref={scrollerRef}
          className='-mx-4 flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        >
          {items.map((item) => (
            <PillLink key={item.id} item={item} active={item.id === activeItemId} />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label='Event management' className={cn('space-y-5', className)}>
      {sections.map((section) => {
        const headingId = `manage-nav-${section.id}`;

        return (
          <div key={section.id}>
            {section.id !== 'overview' && (
              <h3
                id={headingId}
                className='mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-neutral-500'
              >
                {section.label}
              </h3>
            )}
            <ul
              className='space-y-0.5'
              aria-labelledby={section.id !== 'overview' ? headingId : undefined}
            >
              {section.items.map((item) => (
                <li key={item.id}>
                  <SidebarLink item={item} active={item.id === activeItemId} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
