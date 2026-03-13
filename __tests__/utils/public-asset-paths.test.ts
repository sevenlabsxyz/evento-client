import {
  isPublicAssetPathSegment,
  shouldBypassUsernameRoute,
} from '@/lib/utils/public-asset-paths';

describe('isPublicAssetPathSegment', () => {
  it('flags common crawler and browser asset paths', () => {
    expect(isPublicAssetPathSegment('robots.txt')).toBe(true);
    expect(isPublicAssetPathSegment('favicon.ico')).toBe(true);
    expect(isPublicAssetPathSegment('sellers.json')).toBe(true);
    expect(isPublicAssetPathSegment('apple-touch-icon.png')).toBe(true);
  });

  it('flags generic file-like segments', () => {
    expect(isPublicAssetPathSegment('custom-icon.webp')).toBe(false);
    expect(isPublicAssetPathSegment('feed.xml')).toBe(false);
  });

  it('does not classify usernames as public assets', () => {
    expect(isPublicAssetPathSegment('alex')).toBe(false);
    expect(isPublicAssetPathSegment('alex99')).toBe(false);
    expect(isPublicAssetPathSegment('alex.ai')).toBe(false);
  });
});

describe('shouldBypassUsernameRoute', () => {
  it('bypasses explicit public asset paths', () => {
    expect(shouldBypassUsernameRoute('robots.txt')).toBe(true);
    expect(shouldBypassUsernameRoute('favicon.ico')).toBe(true);
    expect(shouldBypassUsernameRoute('custom-icon.webp')).toBe(true);
  });

  it('bypasses invalid username shapes and reserved segments', () => {
    expect(shouldBypassUsernameRoute('')).toBe(true);
    expect(shouldBypassUsernameRoute('.hidden')).toBe(true);
    expect(shouldBypassUsernameRoute('alex.ai')).toBe(true);
    expect(shouldBypassUsernameRoute('user_name')).toBe(true);
    expect(shouldBypassUsernameRoute('api')).toBe(true);
  });

  it('allows valid username segments', () => {
    expect(shouldBypassUsernameRoute('alex')).toBe(false);
    expect(shouldBypassUsernameRoute('alex99')).toBe(false);
    expect(shouldBypassUsernameRoute('abc123')).toBe(false);
  });
});
