import { NO_COVER_FALLBACK } from '@/lib/constants/default-covers';
import { Cpu, Crown, MessagesSquare, PartyPopper, Sparkles } from '@/lib/icons';
import COVERS from './categories';

export { NO_COVER_FALLBACK };
export const DEFAULT_COVERS = COVERS;

export const COVER_FILTERS = [
  // { label: "Love", value: "LOVE" },
  { label: 'Featured', value: 'FEATURED', icon: Crown },
  { label: 'Party', value: 'PARTY', icon: PartyPopper },
  { label: 'Social', value: 'SOCIAL', icon: MessagesSquare },
  { label: 'Classic', value: 'CLASSIC', icon: Sparkles },
  { label: 'Tech', value: 'TECH', icon: Cpu },
];
