'use client';

import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Icon-only theme switch. Renders in the light state on the server and
 * reconciles after mount so hydration output always matches.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type='button'
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted',
        className
      )}
    >
      {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
    </button>
  );
}
