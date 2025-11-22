import { Bitcoin, Building2, CreditCard, Wallet, Zap } from 'lucide-react';

export type Exchange = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  link: string;
  supportedCountries: string[]; // ISO country codes, empty array = all countries
  type: 'buy' | 'sell' | 'both';
};

/**
 * Curated list of Bitcoin exchanges
 * TODO: Add affiliate/referral links and expand country support
 */
export const EXCHANGES: Exchange[] = [
  {
    id: 'strike',
    name: 'Strike',
    description: 'Buy Bitcoin instantly with no fees',
    icon: Zap,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    link: 'https://strike.me',
    supportedCountries: ['US', 'GB', 'AR'],
    type: 'both',
  },
  {
    id: 'cash-app',
    name: 'Cash App',
    description: 'Buy and sell Bitcoin easily',
    icon: Wallet,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    link: 'https://cash.app',
    supportedCountries: ['US', 'GB'],
    type: 'both',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    description: 'Trusted cryptocurrency exchange',
    icon: Building2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    link: 'https://coinbase.com',
    supportedCountries: ['US', 'GB', 'CA', 'AU', 'SG', 'DE', 'FR', 'ES', 'IT', 'NL'],
    type: 'both',
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description: 'Advanced trading platform',
    icon: Bitcoin,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    link: 'https://kraken.com',
    supportedCountries: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'JP'],
    type: 'both',
  },
  {
    id: 'river',
    name: 'River Financial',
    description: 'Bitcoin-only financial institution',
    icon: Bitcoin,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    link: 'https://river.com',
    supportedCountries: ['US'],
    type: 'both',
  },
  {
    id: 'swan',
    name: 'Swan Bitcoin',
    description: 'Easy Bitcoin savings plan',
    icon: CreditCard,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    link: 'https://swanbitcoin.com',
    supportedCountries: ['US'],
    type: 'buy',
  },
];

/**
 * Filter exchanges by country and type
 */
export function getExchangesForCountry(
  countryCode: string,
  type?: 'buy' | 'sell' | 'both'
): { supported: Exchange[]; others: Exchange[] } {
  const filtered = EXCHANGES.filter((exchange) => {
    const typeMatches = !type || exchange.type === type || exchange.type === 'both';
    return typeMatches;
  });

  const supported = filtered.filter(
    (exchange) =>
      exchange.supportedCountries.length === 0 || exchange.supportedCountries.includes(countryCode)
  );

  const others = filtered.filter(
    (exchange) =>
      exchange.supportedCountries.length > 0 && !exchange.supportedCountries.includes(countryCode)
  );

  return { supported, others };
}
