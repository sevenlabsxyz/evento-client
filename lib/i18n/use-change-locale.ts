'use client';

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type AppLocale } from '@/i18n/config';
import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Persist the chosen locale in the cookie read by i18n/request.ts, then refresh
 * server components so every message re-renders in the new language.
 */
export function useChangeLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLocale = useCallback(
    (locale: AppLocale) => {
      document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = locale;
      startTransition(() => {
        router.refresh();
      });
    },
    [router]
  );

  return { changeLocale, isPending };
}
