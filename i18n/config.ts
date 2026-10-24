export const LOCALES = ['en', 'pt-BR', 'es'] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

/** Cookie read by `i18n/request.ts` on every request. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native names so people can always find their own language. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
};

/** BCP 47 tags used for Intl date/number formatting. */
export const INTL_LOCALES: Record<AppLocale, string> = {
  en: 'en-US',
  'pt-BR': 'pt-BR',
  es: 'es',
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Map an arbitrary locale tag (cookie value or Accept-Language entry) to a
 * supported locale: exact match first, then language match (pt-PT -> pt-BR,
 * es-MX -> es), else null.
 */
export function matchLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const normalized = value.trim();
  if (isAppLocale(normalized)) return normalized;

  const language = normalized.toLowerCase().split(/[-_]/)[0];
  if (language === 'pt') return 'pt-BR';
  if (language === 'es') return 'es';
  if (language === 'en') return 'en';
  return null;
}

/** Pick the best supported locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null | undefined): AppLocale | null {
  if (!acceptLanguage) return null;

  const candidates = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((candidate) => candidate.tag && candidate.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of candidates) {
    const match = matchLocale(candidate.tag);
    if (match) return match;
  }
  return null;
}
