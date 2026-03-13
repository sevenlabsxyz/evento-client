const USERNAME_SEGMENT_PATTERN = /^[a-z0-9]{3,20}$/i;

const RESERVED_USERNAME_SEGMENTS = new Set(['api', 'auth', 'blog', 'e', 'event']);

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

  return RESERVED_PUBLIC_ASSET_SEGMENTS.has(normalizedSegment);
}

export function shouldBypassUsernameRoute(segment: string): boolean {
  const normalizedSegment = segment.trim().toLowerCase();

  if (!normalizedSegment) {
    return true;
  }

  if (isPublicAssetPathSegment(normalizedSegment)) {
    return true;
  }

  if (RESERVED_USERNAME_SEGMENTS.has(normalizedSegment)) {
    return true;
  }

  return !USERNAME_SEGMENT_PATTERN.test(normalizedSegment);
}
