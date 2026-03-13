import { isPublicAssetPathSegment } from '@/lib/utils/public-asset-paths';

describe('isPublicAssetPathSegment', () => {
  it('flags common crawler and browser asset paths', () => {
    expect(isPublicAssetPathSegment('robots.txt')).toBe(true);
    expect(isPublicAssetPathSegment('favicon.ico')).toBe(true);
    expect(isPublicAssetPathSegment('sellers.json')).toBe(true);
    expect(isPublicAssetPathSegment('apple-touch-icon.png')).toBe(true);
  });

  it('flags generic file-like segments', () => {
    expect(isPublicAssetPathSegment('custom-icon.webp')).toBe(true);
    expect(isPublicAssetPathSegment('feed.xml')).toBe(true);
  });

  it('allows normal username slugs', () => {
    expect(isPublicAssetPathSegment('alex')).toBe(false);
    expect(isPublicAssetPathSegment('alex99')).toBe(false);
    expect(isPublicAssetPathSegment('user_name')).toBe(false);
  });
});
