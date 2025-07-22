/**
 * Extract the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain or original URL if parsing fails
 */
export function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch {
    return url;
  }
}

/**
 * Ensures a URL has a protocol
 * @param url The URL to ensure has a protocol
 * @returns The URL with a protocol
 */
export function ensureProtocol(url: string): string {
  if (!url) return '';
  
  if (!url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  
  return url;
}
