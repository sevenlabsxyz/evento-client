import {
  buildEventSocialImageUrl,
  formatEventSeoDescription,
  formatEventSeoTitle,
  getSocialImageVersion,
  resolveEventSocialCoverUrl,
} from '@/lib/utils/event-social-metadata';

describe('event social metadata helpers', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalVercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.VERCEL_URL = originalVercelUrl;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelProductionUrl;
  });

  it('formats event SEO titles with Evento suffix', () => {
    expect(formatEventSeoTitle('Bitcoin Pizza Day')).toBe('Bitcoin Pizza Day - Evento');
  });

  it('falls back for untitled events', () => {
    expect(formatEventSeoTitle('Untitled Event')).toBe('RSVP on Evento Now');
    expect(formatEventSeoTitle('')).toBe('RSVP on Evento Now');
  });

  it('sanitizes event descriptions for metadata', () => {
    expect(formatEventSeoDescription('<p>Hello<br />world</p>')).toBe('Hello world');
  });

  it('builds a version string from updated_at', () => {
    expect(
      getSocialImageVersion({
        updatedAt: '2026-03-23T12:34:56.000Z',
        title: 'Bitcoin Pizza Day',
        cover: '/eventos/uploaded-covers/cov_123.png',
      })
    ).toMatch(/^1774269296000-/);
  });

  it('builds a versioned event social image url', () => {
    expect(
      buildEventSocialImageUrl('evt_123', {
        updatedAt: '2026-03-23T12:34:56.000Z',
        title: 'Bitcoin Pizza Day',
        cover: '/eventos/uploaded-covers/cov_123.png',
      })
    ).toMatch(/^https:\/\/app\.evento\.so\/e\/evt_123\/social-image\?v=1774269296000-/);
  });

  it('still versions the image url when updated_at is missing', () => {
    const before = buildEventSocialImageUrl('evt_123', {
      title: 'Bitcoin Pizza Day',
      cover: '/eventos/uploaded-covers/cov_123.png',
    });
    const after = buildEventSocialImageUrl('evt_123', {
      title: 'Bitcoin Pizza Day: Afterparty',
      cover: '/eventos/uploaded-covers/cov_123.png',
    });

    expect(before).not.toBe(after);
  });

  it('keeps webp cover paths on the render endpoint', () => {
    expect(resolveEventSocialCoverUrl('/eventos/default-covers/tech/15.webp')).toBe(
      'https://api.evento.so/storage/v1/render/image/public/cdn/eventos/default-covers/tech/15.webp?width=800&height=800'
    );
  });
});
