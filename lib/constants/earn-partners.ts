import { CreditCard, Gift, ShoppingBag, Smartphone } from 'lucide-react';

export type EarnPartner = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  link: string;
  ctaText: string;
  earnings: string; // e.g., "Up to 8.5% back"
};

/**
 * Curated list of partners where users can earn Bitcoin
 * TODO: Add affiliate/referral links
 */
export const EARN_PARTNERS: EarnPartner[] = [
  {
    id: 'fold',
    name: 'Fold',
    description: 'Earn Bitcoin rewards on everyday purchases with the Fold debit card',
    icon: CreditCard,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    link: 'https://foldapp.com',
    ctaText: 'Get Fold Card',
    earnings: 'Up to 5% back',
  },
  {
    id: 'lolli',
    name: 'Lolli',
    description: 'Earn Bitcoin when you shop at 1,000+ top stores online',
    icon: ShoppingBag,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    link: 'https://lolli.com',
    ctaText: 'Shop & Earn',
    earnings: 'Up to 30% back',
  },
  {
    id: 'satsback',
    name: 'Satsback',
    description: 'Get satoshis back when shopping at participating merchants',
    icon: Gift,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    link: 'https://satsback.com',
    ctaText: 'Start Earning',
    earnings: 'Varies by store',
  },
  {
    id: 'stacker-news',
    name: 'Stacker News',
    description: 'Earn sats by contributing quality content and discussions',
    icon: Smartphone,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    link: 'https://stacker.news',
    ctaText: 'Join Community',
    earnings: 'Earn while learning',
  },
];
