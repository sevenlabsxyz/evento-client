import { DEFAULT_LOCALE, INTL_LOCALES, isAppLocale, type AppLocale } from '@/i18n/config';

/**
 * Locale for non-React formatting helpers (e.g. lib/utils/date.ts). React code
 * should prefer `useLocale()` / `useFormatter()` from next-intl; this mirror is
 * set by <ActiveLocaleSync /> so plain functions format in the user's language.
 */
let activeLocale: AppLocale = DEFAULT_LOCALE;

export function setActiveLocale(locale: string): void {
  if (isAppLocale(locale)) activeLocale = locale;
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

/** BCP 47 tag for Intl APIs (`toLocaleDateString`, `Intl.NumberFormat`, ...). */
export function getIntlLocale(locale: string = activeLocale): string {
  return isAppLocale(locale) ? INTL_LOCALES[locale] : INTL_LOCALES[DEFAULT_LOCALE];
}
