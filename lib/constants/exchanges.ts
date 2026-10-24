import { translateHooks } from '@/lib/i18n/active-translator';

export type Exchange = {
  id: string;
  name: string;
  description: string;
  logo: string;
  link: string;
  supportedCountries: string[]; // ISO country codes, empty array = all countries
  isGlobal: boolean;
};

/**
 * Regional exchanges - shown based on user's location
 */
export const REGIONAL_EXCHANGES: Exchange[] = [
  {
    id: 'cash-app',
    name: 'Cash App',
    get description() {
      return translateHooks('exchanges.cashApp');
    },
    logo: '/assets/partners/cashapp.webp',
    link: 'https://cash.app',
    supportedCountries: ['US', 'GB'],
    isGlobal: false,
  },
  {
    id: 'river',
    name: 'River',
    get description() {
      return translateHooks('exchanges.river');
    },
    logo: '/assets/partners/river.webp',
    link: 'https://river.com',
    supportedCountries: ['US'],
    isGlobal: false,
  },
  {
    id: 'strike',
    name: 'Strike',
    get description() {
      return translateHooks('exchanges.strike');
    },
    logo: '/assets/partners/strike.webp',
    link: 'https://strike.me',
    supportedCountries: ['US', 'GB', 'AR'],
    isGlobal: false,
  },
  {
    id: 'flash',
    name: 'Flash',
    get description() {
      return translateHooks('exchanges.flash');
    },
    logo: '/assets/partners/flash.svg',
    link: 'https://getflash.io/',
    supportedCountries: ['JM'],
    isGlobal: false,
  },
];

/**
 * Global exchanges - always shown for all users
 */
export const GLOBAL_EXCHANGES: Exchange[] = [
  {
    id: 'kraken',
    name: 'Kraken',
    get description() {
      return translateHooks('exchanges.kraken');
    },
    logo: '/assets/partners/kraken.webp',
    link: 'https://kraken.com',
    supportedCountries: [],
    isGlobal: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    get description() {
      return translateHooks('exchanges.coinbase');
    },
    logo: '/assets/partners/coinbase.webp',
    link: 'https://coinbase.com',
    supportedCountries: [],
    isGlobal: true,
  },
];

/**
 * Get exchanges for a specific country
 */
export function getExchangesForCountry(countryCode: string): {
  regional: Exchange[];
  global: Exchange[];
} {
  const regional = REGIONAL_EXCHANGES.filter(
    (exchange) =>
      exchange.supportedCountries.length === 0 || exchange.supportedCountries.includes(countryCode)
  );

  return {
    regional,
    global: GLOBAL_EXCHANGES,
  };
}
