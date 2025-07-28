import { UserDetails } from '../types/api';

/**
 * Check if a user has completed onboarding
 * A user is considered onboarded if they have both username and name filled
 */
export function isUserOnboarded(user: UserDetails | null): boolean {
  if (!user) {
    console.log('isUserOnboarded: No user provided');
    return false;
  }

  const hasUsername = user.username && user.username.trim() !== '';
  const hasName = user.name && user.name.trim() !== '';

  console.log('isUserOnboarded: Checking user:', {
    username: user.username,
    name: user.name,
    hasUsername,
    hasName,
  });

  return Boolean(hasUsername && hasName);
}

/**
 * Validate redirect URL for security
 * Only allow same-origin redirects and valid routes
 */
export function validateRedirectUrl(url: string): string {
  // Default redirect
  const defaultRedirect = '/';

  if (!url) return defaultRedirect;

  try {
    // Check if it's a relative URL (starts with /)
    if (url.startsWith('/')) {
      // Remove multiple slashes
      const cleanUrl = url.replace(/\/+/g, '/');

      // Prevent protocol-relative URLs
      if (cleanUrl.startsWith('//')) {
        return defaultRedirect;
      }

      return cleanUrl;
    }

    // Check if it's an absolute URL to the same origin
    const parsedUrl = new URL(url, window.location.origin);
    if (parsedUrl.origin === window.location.origin) {
      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    }

    // Invalid URL, return default
    return defaultRedirect;
  } catch {
    // Invalid URL, return default
    return defaultRedirect;
  }
}

/**
 * Get onboarding redirect URL with original destination preserved
 */
export function getOnboardingRedirectUrl(originalRedirect?: string | null): string {
  const validatedRedirect = validateRedirectUrl(originalRedirect || '/');
  return `/onboarding?redirect=${encodeURIComponent(validatedRedirect)}`;
}
