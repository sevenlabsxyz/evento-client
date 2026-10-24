import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { MESSAGES } from '@/messages/load';

import { DEFAULT_LOCALE, LOCALE_COOKIE, matchLocale, negotiateLocale } from './config';

/**
 * Locale resolution without URL prefixes: explicit choice (cookie, set from
 * Settings) wins, then the browser's Accept-Language, then English.
 */
export default getRequestConfig(async () => {
  const cookieLocale = matchLocale(cookies().get(LOCALE_COOKIE)?.value);
  const locale =
    cookieLocale ?? negotiateLocale(headers().get('accept-language')) ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: MESSAGES[locale],
  };
});
