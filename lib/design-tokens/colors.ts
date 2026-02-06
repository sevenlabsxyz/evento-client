import { logger } from '@/lib/utils/logger';

/**
 * Design tokens for consistent theming across the application
 */

export const designTokens = {
  colors: {
    // Brand colors
    primary: {
      50: 'rgb(254, 242, 242)', // red-50
      100: 'rgb(254, 226, 226)', // red-100
      400: 'rgb(248, 113, 113)', // red-400
      500: 'rgb(239, 68, 68)', // red-500
      600: 'rgb(220, 38, 38)', // red-600
    },
    // Gradients - CSS classes for Tailwind
    gradients: {
      primaryBanner: 'bg-gradient-to-br from-red-400 to-red-600',
      primaryButton: 'bg-red-500 hover:bg-red-600',
    },
    // Status colors
    success: {
      500: 'rgb(34, 197, 94)', // green-500
      600: 'rgb(22, 163, 74)', // green-600
    },
    warning: {
      500: 'rgb(245, 158, 11)', // amber-500
      600: 'rgb(217, 119, 6)', // amber-600
    },
    // Neutral colors
    gray: {
      50: 'rgb(249, 250, 251)', // gray-50
      100: 'rgb(243, 244, 246)', // gray-100
      200: 'rgb(229, 231, 235)', // gray-200
      300: 'rgb(209, 213, 219)', // gray-300
      500: 'rgb(107, 114, 128)', // gray-500
      600: 'rgb(75, 85, 99)', // gray-600
      700: 'rgb(55, 65, 81)', // gray-700
      900: 'rgb(17, 24, 39)', // gray-900
    },
    // Special colors
    orange: {
      100: 'rgb(255, 237, 213)', // orange-100
      300: 'rgb(253, 186, 116)', // orange-300
      700: 'rgb(194, 65, 12)', // orange-700
    },
  },
  spacing: {
    // Profile sheet specific spacing
    bannerHeight: '8rem', // h-32
    profileOverlap: '-3rem', // -bottom-12
    contentPadding: '1.5rem', // px-6
    profileTopMargin: '4rem', // pt-16
  },
  borderRadius: {
    sheet: '1rem', // rounded-2xl
    button: '0.75rem', // rounded-xl
    card: '0.75rem', // rounded-xl
  },
} as const;

// Helper function to get design token values
export const getDesignToken = (path: string) => {
  const keys = path.split('.');
  let current: any = designTokens;

  for (const key of keys) {
    if (current && current[key] !== undefined) {
      current = current[key];
    } else {
      logger.warn('Design token not found', { path });
      return undefined;
    }
  }

  return current;
};

// Validation helper for usernames
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{1,30}$/;

export const validateUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  return USERNAME_REGEX.test(username);
};
