import type { useTranslations } from 'next-intl';

/**
 * Translator bound to one top-level namespace, for helpers that receive `t`
 * from a component. next-intl 3 does not export this type directly.
 */
export type Translator<Namespace extends keyof IntlMessages> = ReturnType<
  typeof useTranslations<Namespace>
>;
