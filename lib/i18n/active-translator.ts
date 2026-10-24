import type { Translator } from '@/lib/i18n/types';
/**
 * Translator for plain (non-React) lib code: services, error handlers and
 * formatters that must produce a user-facing string at call time. React code
 * should call `useTranslations('hooks')` directly; this mirror is registered by
 * <ActiveLocaleSync /> so it always follows the active next-intl locale.
 */
export type HooksTranslator = Translator<'hooks'>;

/** Any message key in the `hooks` namespace, e.g. `'validation.emailRequired'`. */
export type HooksMessageKey = Parameters<HooksTranslator>[0];
type HooksValues = Parameters<HooksTranslator>[1];

let translator: HooksTranslator | null = null;

export function setHooksTranslator(t: HooksTranslator): void {
  translator = t;
}

/**
 * Translate a `hooks` namespace key. Before a translator is registered (code
 * running ahead of the first render) it returns the namespaced key, matching
 * next-intl's own missing-message fallback.
 */
export function translateHooks(key: HooksMessageKey, values?: HooksValues): string {
  return translator ? translator(key, values) : `hooks.${key}`;
}
