'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type React from 'react';

const THEMES = ['light', 'dark'] as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='light'
      enableSystem={false}
      themes={[...THEMES]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
