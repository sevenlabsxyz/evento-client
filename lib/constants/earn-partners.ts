import { translateHooks } from '@/lib/i18n/active-translator';

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
    get description() {
      return translateHooks('earnPartners.zbd');
    },
    logo: '/assets/partners/zbd.webp',
    link: 'https://zbd.gg',
    get ctaText() {
      return translateHooks('earnPartners.visit');
    },
  },
  {
    id: 'fold',
    name: 'Fold',
    get description() {
      return translateHooks('earnPartners.fold');
    },
    logo: '/assets/partners/fold.webp',
    link: 'https://foldapp.com',
    get ctaText() {
      return translateHooks('earnPartners.visit');
    },
  },
  {
    id: 'stacker-news',
    name: 'Stacker News',
    get description() {
      return translateHooks('earnPartners.stackerNews');
    },
    logo: '/assets/partners/stacker-news.avif',
    link: 'https://stacker.news',
    get ctaText() {
      return translateHooks('earnPartners.visit');
    },
  },
  {
    id: 'lolli',
    name: 'Lolli',
    get description() {
      return translateHooks('earnPartners.lolli');
    },
    logo: '/assets/partners/lolli.webp',
    link: 'https://lolli.com',
    get ctaText() {
      return translateHooks('earnPartners.visit');
    },
  },
];
