import { LOCALES, matchLocale, negotiateLocale } from '@/i18n/config';
import { MESSAGES } from '@/messages/load';
import { IntlMessageFormat } from 'intl-messageformat';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

const english = flatten(MESSAGES.en as unknown as Tree);

describe('translation catalogs', () => {
  it.each(LOCALES.filter((locale) => locale !== 'en'))(
    '%s has exactly the English keys',
    (locale) => {
      const translated = flatten(MESSAGES[locale] as unknown as Tree);
      expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
    }
  );

  it.each(LOCALES)('%s messages are valid ICU with no empty strings', (locale) => {
    const messages = flatten(MESSAGES[locale] as unknown as Tree);
    for (const [key, message] of Object.entries(messages)) {
      expect({ key, empty: message.trim() === '' }).toEqual({ key, empty: false });
      expect(() => new IntlMessageFormat(message, locale)).not.toThrow();
    }
  });
});

describe('locale negotiation', () => {
  it('maps regional variants to supported locales', () => {
    expect(matchLocale('pt-PT')).toBe('pt-BR');
    expect(matchLocale('es-MX')).toBe('es');
    expect(matchLocale('fr')).toBeNull();
  });

  it('honours Accept-Language quality ordering', () => {
    expect(negotiateLocale('fr-FR,es;q=0.8,pt-BR;q=0.9')).toBe('pt-BR');
    expect(negotiateLocale('de, fr;q=0.5')).toBeNull();
  });
});
