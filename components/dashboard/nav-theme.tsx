'use client';

import { LucideIcon, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark';

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/**
 * Sidebar footer theme switch. Expanded (and in the mobile sheet) it renders a
 * Light/Dark segmented control; collapsed to icons it renders a single toggle
 * button with a tooltip. Nothing is marked active until mounted so the server
 * markup always matches the first client render.
 */
export function NavTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const { state, isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme: ThemeOption | null = mounted
    ? resolvedTheme === 'dark'
      ? 'dark'
      : 'light'
    : null;
  const isCollapsed = state === 'collapsed' && !isMobile;

  if (isCollapsed) {
    const isDark = activeTheme === 'dark';
    const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={label}
          aria-label={label}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun /> : <Moon />}
          <span>{isDark ? 'Light theme' : 'Dark theme'}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <div
        role='radiogroup'
        aria-label='Theme'
        className='grid h-9 grid-cols-2 gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent p-1 dark:border-neutral-800'
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = activeTheme === value;

          return (
            <button
              key={value}
              type='button'
              role='radio'
              aria-checked={isActive}
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2',
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              )}
            >
              <Icon className='size-3.5' aria-hidden='true' />
              {label}
            </button>
          );
        })}
      </div>
    </SidebarMenuItem>
  );
}
