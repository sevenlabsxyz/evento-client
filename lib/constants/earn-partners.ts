export type EarnPartner = {
  id: string;
  name: string;
  description: string;
  logo: string;
  link: string;
  ctaText: string;
};

/**
 * Curated list of partners where users can earn Bitcoin
 * TODO: Add affiliate/referral links
 */
export const EARN_PARTNERS: EarnPartner[] = [
  {
    id: 'zbd',
    name: 'ZBD',
    description: 'Earn Bitcoin by playing games and completing tasks',
    logo: '/assets/partners/zbd.webp',
    link: 'https://zbd.gg',
    ctaText: 'Start Playing',
  },
  {
    id: 'fold',
    name: 'Fold',
    description: 'Earn Bitcoin rewards on everyday purchases with the Fold debit card',
    logo: '/assets/partners/fold.webp',
    link: 'https://foldapp.com',
    ctaText: 'Get Fold Card',
  },
  {
    id: 'lolli',
    name: 'Lolli',
    description: 'Earn Bitcoin when you shop at 1,000+ top stores online',
    logo: '/assets/partners/lolli.webp',
    link: 'https://lolli.com',
    ctaText: 'Shop & Earn',
  },
];
