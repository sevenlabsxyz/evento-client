/**
 * Utility functions for validating external URLs used in link/window.open sinks
 */

/**
 * Returns a safe external URL for use in href or window.open sinks.
 * Only http/https URLs are allowed; anything else (javascript:, data:, etc.)
 * is replaced with '#' to prevent URL-scheme injection.
 */
export function safeExternalUrl(url: string | null | undefined): string {
  if (!url) return '#';

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return '#';
  } catch {
    return '#';
  }
}
