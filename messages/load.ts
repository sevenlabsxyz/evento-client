import type { AppLocale } from '@/i18n/config';

import en from './en';
import es from './es';
import ptBR from './pt-BR';

export type Messages = typeof en;

export const MESSAGES: Record<AppLocale, Messages> = {
  en,
  'pt-BR': ptBR,
  es,
};

export const NAMESPACES = Object.keys(en) as (keyof Messages)[];
