import { GhostPost, GhostTag } from '@/lib/types/ghost';
import {
  INTERNAL_BLOG_TAG_SLUGS,
  formatPostDate,
  getPostExcerpt,
  getPrimaryVisibleTag,
  getReadingMinutes,
  getVisibleTags,
} from '@/lib/utils/blog';

function makeTag(slug: string, name = slug): GhostTag {
  return { id: `tag-${slug}`, slug, name, description: null, url: `https://blog/tag/${slug}` };
}

function makePost(overrides: Partial<GhostPost> = {}): GhostPost {
  return {
    id: 'post-1',
    uuid: 'uuid-1',
    title: 'Hello',
    slug: 'hello',
    html: null,
    excerpt: null,
    custom_excerpt: null,
    feature_image: null,
    feature_image_alt: null,
    featured: false,
    published_at: null,
    reading_time: 0,
    url: 'https://blog/hello',
    tags: [],
    authors: [],
    primary_author: null,
    primary_tag: null,
    ...overrides,
  };
}

describe('getPostExcerpt', () => {
  it('prefers the custom excerpt and trims it', () => {
    expect(getPostExcerpt(makePost({ custom_excerpt: '  Custom  ', excerpt: 'Auto' }))).toBe(
      'Custom'
    );
  });

  it('falls back to the generated excerpt, then an empty string', () => {
    expect(getPostExcerpt(makePost({ excerpt: 'Auto\n' }))).toBe('Auto');
    expect(getPostExcerpt(makePost())).toBe('');
  });
});

describe('getVisibleTags', () => {
  it('excludes Evento routing tags and Ghost internal tags', () => {
    const post = makePost({
      tags: [
        makeTag('blog', 'Blog'),
        makeTag('hub', 'Hub'),
        makeTag('hash-newsletter', '#newsletter'),
        makeTag('weird', '#weird-name'),
        makeTag('guides', 'Guides'),
        makeTag('product', 'Product'),
      ],
    });

    expect(getVisibleTags(post).map((tag) => tag.slug)).toEqual(['guides', 'product']);
    expect(INTERNAL_BLOG_TAG_SLUGS).toEqual(['blog', 'hub']);
  });

  it('handles posts fetched without tags', () => {
    const post = makePost({ tags: undefined as unknown as GhostTag[] });
    expect(getVisibleTags(post)).toEqual([]);
  });
});

describe('getPrimaryVisibleTag', () => {
  it('uses the primary tag when it is visible', () => {
    const guides = makeTag('guides', 'Guides');
    const post = makePost({ primary_tag: guides, tags: [makeTag('product'), guides] });
    expect(getPrimaryVisibleTag(post)).toBe(guides);
  });

  it('skips an internal primary tag in favor of the first visible tag', () => {
    const product = makeTag('product', 'Product');
    const blog = makeTag('blog', 'Blog');
    const post = makePost({ primary_tag: blog, tags: [blog, product] });
    expect(getPrimaryVisibleTag(post)).toBe(product);
  });

  it('returns null when only internal tags exist', () => {
    const blog = makeTag('blog', 'Blog');
    expect(getPrimaryVisibleTag(makePost({ primary_tag: blog, tags: [blog] }))).toBeNull();
  });
});

describe('formatPostDate', () => {
  it('formats long and short styles', () => {
    expect(formatPostDate('2026-10-13T12:00:00.000Z')).toBe('October 13, 2026');
    expect(formatPostDate('2026-10-13T12:00:00.000Z', 'long')).toBe('October 13, 2026');
    expect(formatPostDate('2026-10-13T12:00:00.000Z', 'short')).toBe('Oct 13, 2026');
  });

  it('formats in UTC so the calendar day does not shift by timezone', () => {
    expect(formatPostDate('2026-10-13T23:30:00.000Z', 'short')).toBe('Oct 13, 2026');
    expect(formatPostDate('2026-10-14T01:00:00.000+02:00', 'short')).toBe('Oct 13, 2026');
  });

  it('formats in the requested locale', () => {
    expect(formatPostDate('2026-10-13T12:00:00.000Z', 'long', 'pt-BR')).toBe(
      '13 de outubro de 2026'
    );
    expect(formatPostDate('2026-10-13T12:00:00.000Z', 'long', 'es')).toBe('13 de octubre de 2026');
  });

  it('returns an empty string for null or invalid input', () => {
    expect(formatPostDate(null)).toBe('');
    expect(formatPostDate('')).toBe('');
    expect(formatPostDate('not-a-date', 'short')).toBe('');
  });
});

describe('getReadingMinutes', () => {
  it('returns null for zero, negative, or non-finite minutes', () => {
    expect(getReadingMinutes(0)).toBeNull();
    expect(getReadingMinutes(-3)).toBeNull();
    expect(getReadingMinutes(Number.NaN)).toBeNull();
  });

  it('rounds positive minutes', () => {
    expect(getReadingMinutes(1)).toBe(1);
    expect(getReadingMinutes(6.6)).toBe(7);
  });
});
