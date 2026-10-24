import { DEFAULT_COVERS } from '@/components/event-covers';
import { translateHooks } from '@/lib/i18n/active-translator';
import { Clapperboard, Cpu, Crown, Image, MessagesSquare, PartyPopper } from 'lucide-react';
import React from 'react';

export interface CoverImage {
  id: string;
  url: string;
  title?: string;
  category: string;
}

export interface CoverImageCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  images: CoverImage[];
}

type CoverCategoryId = 'featured' | 'party' | 'social' | 'classic' | 'tech';

// Helper function to convert legacy cover format to new format
function convertLegacyCovers(
  legacyCovers: { url: string }[],
  categoryId: CoverCategoryId
): CoverImage[] {
  return legacyCovers.map((cover, index) => ({
    id: `${categoryId}-${index + 1}`,
    url: cover.url,
    get title() {
      return translateHooks('covers.coverTitle', {
        category: translateHooks(`covers.categories.${categoryId}`),
        number: index + 1,
      });
    },
    category: categoryId,
  }));
}

export const coverImageCategories: CoverImageCategory[] = [
  {
    id: 'featured',
    get name() {
      return translateHooks('covers.categories.featured');
    },
    icon: Crown,
    featured: true,
    images: convertLegacyCovers(DEFAULT_COVERS.FEATURED, 'featured'),
  },
  {
    id: 'giphy',
    get name() {
      return translateHooks('covers.categories.gifs');
    },
    icon: Clapperboard,
    images: [], // No static images, will be loaded dynamically
  },
  {
    id: 'party',
    get name() {
      return translateHooks('covers.categories.party');
    },
    icon: PartyPopper,
    images: convertLegacyCovers(DEFAULT_COVERS.PARTY, 'party'),
  },
  {
    id: 'social',
    get name() {
      return translateHooks('covers.categories.social');
    },
    icon: MessagesSquare,
    images: convertLegacyCovers(DEFAULT_COVERS.SOCIAL, 'social'),
  },
  {
    id: 'classic',
    get name() {
      return translateHooks('covers.categories.classic');
    },
    icon: Image,
    images: convertLegacyCovers(DEFAULT_COVERS.CLASSIC, 'classic'),
  },
  {
    id: 'tech',
    get name() {
      return translateHooks('covers.categories.tech');
    },
    icon: Cpu,
    images: convertLegacyCovers(DEFAULT_COVERS.TECH, 'tech'),
  },
];

export const getFeaturedImages = () => {
  return coverImageCategories
    .filter((category) => category.featured)
    .flatMap((category) => category.images);
};

export const getImagesByCategory = (categoryId: string) => {
  const category = coverImageCategories.find((cat) => cat.id === categoryId);
  return category?.images || [];
};

export const getCategoryById = (categoryId: string) => {
  return coverImageCategories.find((cat) => cat.id === categoryId);
};
