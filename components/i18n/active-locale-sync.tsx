'use client';

import { setActiveLocale } from '@/lib/i18n/active-locale';
import { useLocale } from 'next-intl';

/** Keeps the non-React formatting locale in step with next-intl. Renders nothing. */
export function ActiveLocaleSync() {
  const locale = useLocale();
  // Set during render (not in an effect) so children formatting dates in this
  // same render pass already see the right locale.
  setActiveLocale(locale);
  return null;
}
