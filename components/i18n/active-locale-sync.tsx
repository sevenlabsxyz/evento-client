'use client';

import { setActiveLocale } from '@/lib/i18n/active-locale';
import { setHooksTranslator } from '@/lib/i18n/active-translator';
import { useLocale, useTranslations } from 'next-intl';

/** Keeps the non-React formatting locale in step with next-intl. Renders nothing. */
export function ActiveLocaleSync() {
  const locale = useLocale();
  const tHooks = useTranslations('hooks');
  // Set during render (not in an effect) so children formatting dates in this
  // same render pass already see the right locale.
  setActiveLocale(locale);
  setHooksTranslator(tHooks);
  return null;
}
