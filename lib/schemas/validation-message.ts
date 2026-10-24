import { translateHooks, type HooksMessageKey } from '@/lib/i18n/active-translator';

/**
 * Zod `error` param that resolves the message when the issue is raised, not
 * when the schema module loads, so module-level schemas follow the active locale.
 */
export function validationMessage(key: HooksMessageKey): { error: () => string } {
  return { error: () => translateHooks(key) };
}
