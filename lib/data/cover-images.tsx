import React from 'react';
import {
  Cpu,
  Crown,
  MessagesSquare,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_COVERS } from '@/components/event-covers';
import GiphyIcon from '@/components/icons/giphy-icon';

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

// Helper function to convert legacy cover format to new format
function convertLegacyCovers(
  legacyCovers: { url: string }[],
  categoryName: string
): CoverImage[] {
  return legacyCovers.map((cover, index) => ({
    id: `${categoryName.toLowerCase()}-${index + 1}`,
    url: cover.url,
    title: `${categoryName} Cover ${index + 1}`,
    category: categoryName.toLowerCase(),
  }));
}

export const coverImageCategories: CoverImageCategory[] = [
  {
    id: 'featured',
    name: 'Featured',
    icon: Crown,
    featured: true,
    images: convertLegacyCovers(DEFAULT_COVERS.FEATURED, 'Featured'),
  },
  {
    id: 'party',
    name: 'Party',
    icon: PartyPopper,
    images: convertLegacyCovers(DEFAULT_COVERS.PARTY, 'Party'),
  },
  {
    id: 'social',
    name: 'Social',
    icon: MessagesSquare,
    images: convertLegacyCovers(DEFAULT_COVERS.SOCIAL, 'Social'),
  },
  {
    id: 'classic',
    name: 'Classic',
    icon: Sparkles,
    images: convertLegacyCovers(DEFAULT_COVERS.CLASSIC, 'Classic'),
  },
  {
    id: 'tech',
    name: 'Tech',
    icon: Cpu,
    images: convertLegacyCovers(DEFAULT_COVERS.TECH, 'Tech'),
  },
  {
    id: 'giphy',
    name: 'GIFs',
    icon: GiphyIcon,
    images: [], // No static images, will be loaded dynamically
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
