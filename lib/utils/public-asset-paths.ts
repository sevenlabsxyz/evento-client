const FILE_LIKE_SEGMENT_PATTERN = /\.[a-z0-9]+$/i;

const RESERVED_PUBLIC_ASSET_SEGMENTS = new Set([
  'ads.txt',
  'app-ads.txt',
  'apple-touch-icon-precomposed.png',
  'apple-touch-icon.png',
  'browserconfig.xml',
  'dsrdelete.json',
  'favicon.ico',
  'favicon.png',
  'humans.txt',
  'llms.txt',
  'manifest.json',
  'robots.txt',
  'security.txt',
  'sellers.json',
  'site.webmanifest',
  'sitemap.xml',
]);

export function isPublicAssetPathSegment(segment: string): boolean {
  const normalizedSegment = segment.trim().toLowerCase();

  if (!normalizedSegment || normalizedSegment.startsWith('.')) {
    return true;
  }

  return (
    RESERVED_PUBLIC_ASSET_SEGMENTS.has(normalizedSegment) ||
    FILE_LIKE_SEGMENT_PATTERN.test(normalizedSegment)
  );
}
