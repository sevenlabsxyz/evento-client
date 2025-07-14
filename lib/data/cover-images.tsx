import React from "react";
import { Sparkles, Sun, Cloud, Heart, Diamond, Building2 } from "lucide-react";

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

export const coverImageCategories: CoverImageCategory[] = [
  {
    id: "suggested",
    name: "Suggested",
    icon: Sparkles,
    featured: true,
    images: [
      {
        id: "beach-1",
        url: "/api/placeholder/300/300",
        title: "Beach & Friends",
        category: "suggested",
      },
      {
        id: "drink-1",
        url: "/api/placeholder/300/301",
        title: "Summer Drink",
        category: "suggested",
      },
      {
        id: "festival-1",
        url: "/api/placeholder/300/302",
        title: "Music Festival",
        category: "suggested",
      },
      {
        id: "sunset-1",
        url: "/api/placeholder/300/303",
        title: "Golden Hour",
        category: "suggested",
      },
    ],
  },
  {
    id: "summer",
    name: "Summer",
    icon: Sun,
    images: [
      {
        id: "beach-2",
        url: "/api/placeholder/300/400",
        title: "Beach Day",
        category: "summer",
      },
      {
        id: "cocktail-1",
        url: "/api/placeholder/300/401",
        title: "Tropical Cocktail",
        category: "summer",
      },
      {
        id: "pool-1",
        url: "/api/placeholder/300/402",
        title: "Pool Party",
        category: "summer",
      },
      {
        id: "surf-1",
        url: "/api/placeholder/300/403",
        title: "Surfing",
        category: "summer",
      },
      {
        id: "picnic-1",
        url: "/api/placeholder/300/404",
        title: "Summer Picnic",
        category: "summer",
      },
      {
        id: "festival-2",
        url: "/api/placeholder/300/405",
        title: "Outdoor Festival",
        category: "summer",
      },
    ],
  },
  {
    id: "french-culture",
    name: "French Culture",
    icon: Building2,
    images: [
      {
        id: "bastille-1",
        url: "/api/placeholder/300/500",
        title: "Tous À La Bastille",
        category: "french-culture",
      },
      {
        id: "music-fest",
        url: "/api/placeholder/300/501",
        title: "Fête de la Musique",
        category: "french-culture",
      },
      {
        id: "breakfast-1",
        url: "/api/placeholder/300/502",
        title: "Le Petit Déjeuner",
        category: "french-culture",
      },
      {
        id: "petanque-1",
        url: "/api/placeholder/300/503",
        title: "Tournoi de Pétanque",
        category: "french-culture",
      },
      {
        id: "beaujolais-1",
        url: "/api/placeholder/300/504",
        title: "Le Beaujolais Nouveau",
        category: "french-culture",
      },
      {
        id: "competition-1",
        url: "/api/placeholder/300/505",
        title: "Tu Tires Ou Tu Pointes",
        category: "french-culture",
      },
      {
        id: "wine-1",
        url: "/api/placeholder/300/506",
        title: "Vin & Fromage",
        category: "french-culture",
      },
      {
        id: "market-1",
        url: "/api/placeholder/300/507",
        title: "Brocante",
        category: "french-culture",
      },
      {
        id: "galette-1",
        url: "/api/placeholder/300/508",
        title: "Galette des Rois",
        category: "french-culture",
      },
      {
        id: "apero-1",
        url: "/api/placeholder/300/509",
        title: "Apéro!",
        category: "french-culture",
      },
      {
        id: "dejeuner-1",
        url: "/api/placeholder/300/510",
        title: "Le Petit Déjeuner",
        category: "french-culture",
      },
      {
        id: "soif-1",
        url: "/api/placeholder/300/511",
        title: "SOIF",
        category: "french-culture",
      },
    ],
  },
  {
    id: "outdoors",
    name: "Outdoors",
    icon: Cloud,
    images: [
      {
        id: "camping-1",
        url: "/api/placeholder/300/600",
        title: "Camping Under Stars",
        category: "outdoors",
      },
      {
        id: "hiking-1",
        url: "/api/placeholder/300/601",
        title: "Mountain Hiking",
        category: "outdoors",
      },
      {
        id: "forest-1",
        url: "/api/placeholder/300/602",
        title: "Forest Adventure",
        category: "outdoors",
      },
      {
        id: "lake-1",
        url: "/api/placeholder/300/603",
        title: "Lake Activities",
        category: "outdoors",
      },
      {
        id: "sunrise-1",
        url: "/api/placeholder/300/604",
        title: "Sunrise Hike",
        category: "outdoors",
      },
    ],
  },
  {
    id: "pride",
    name: "Pride",
    icon: Heart,
    images: [
      {
        id: "rainbow-1",
        url: "/api/placeholder/300/700",
        title: "Pride Celebration",
        category: "pride",
      },
      {
        id: "flag-1",
        url: "/api/placeholder/300/701",
        title: "Rainbow Flag",
        category: "pride",
      },
      {
        id: "parade-1",
        url: "/api/placeholder/300/702",
        title: "Pride Parade",
        category: "pride",
      },
      {
        id: "community-1",
        url: "/api/placeholder/300/703",
        title: "Community Love",
        category: "pride",
      },
    ],
  },
  {
    id: "wedding",
    name: "Wedding",
    icon: Diamond,
    images: [
      {
        id: "save-date-1",
        url: "/api/placeholder/300/800",
        title: "Save The Date",
        category: "wedding",
      },
      {
        id: "couple-1",
        url: "/api/placeholder/300/801",
        title: "Wedding Couple",
        category: "wedding",
      },
      {
        id: "love-1",
        url: "/api/placeholder/300/802",
        title: "Love Love Love",
        category: "wedding",
      },
      {
        id: "forever-1",
        url: "/api/placeholder/300/803",
        title: "You & Me Forever",
        category: "wedding",
      },
      {
        id: "bouquet-1",
        url: "/api/placeholder/300/804",
        title: "Wedding Bouquet",
        category: "wedding",
      },
      {
        id: "cake-1",
        url: "/api/placeholder/300/805",
        title: "Save The Date Cake",
        category: "wedding",
      },
      {
        id: "rings-1",
        url: "/api/placeholder/300/806",
        title: "Wedding Rings",
        category: "wedding",
      },
      {
        id: "flowers-1",
        url: "/api/placeholder/300/807",
        title: "Save The Date Flowers",
        category: "wedding",
      },
      {
        id: "blue-1",
        url: "/api/placeholder/300/808",
        title: "Blue Floral Save Date",
        category: "wedding",
      },
      {
        id: "floral-1",
        url: "/api/placeholder/300/809",
        title: "Save The Date Flowers",
        category: "wedding",
      },
      {
        id: "air-1",
        url: "/api/placeholder/300/810",
        title: "Love Is In The Air",
        category: "wedding",
      },
      {
        id: "purple-1",
        url: "/api/placeholder/300/811",
        title: "Purple Save The Date",
        category: "wedding",
      },
      {
        id: "gold-1",
        url: "/api/placeholder/300/812",
        title: "Gold Save The Date",
        category: "wedding",
      },
      {
        id: "getting-1",
        url: "/api/placeholder/300/813",
        title: "We Are Getting...",
        category: "wedding",
      },
      {
        id: "beach-wedding-1",
        url: "/api/placeholder/300/814",
        title: "Beach Wedding",
        category: "wedding",
      },
    ],
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
