import { GhostPost, GhostTag } from '@/lib/types/ghost';

/** Tags used to route posts into Evento surfaces; never shown to readers. */
export const INTERNAL_BLOG_TAG_SLUGS = ['blog', 'hub'];

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function getPostExcerpt(post: GhostPost): string {
  return (post.custom_excerpt ?? post.excerpt ?? '').trim();
}

function isVisibleTag(tag: GhostTag): boolean {
  if (INTERNAL_BLOG_TAG_SLUGS.includes(tag.slug)) return false;
  // Ghost internal tags (`#name`) are exposed with a `hash-` slug prefix.
  return !tag.slug.startsWith('hash-') && !tag.name.startsWith('#');
}

export function getVisibleTags(post: GhostPost): GhostTag[] {
  return (post.tags ?? []).filter(isVisibleTag);
}

export function getPrimaryVisibleTag(post: GhostPost): GhostTag | null {
  if (post.primary_tag && isVisibleTag(post.primary_tag)) {
    return post.primary_tag;
  }
  return getVisibleTags(post)[0] ?? null;
}

/**
 * Formats a Ghost ISO timestamp in UTC so server and client renders agree.
 * Returns '' for missing or unparsable input.
 */
export function formatPostDate(iso: string | null, style: 'long' | 'short' = 'long'): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (style === 'short' ? SHORT_DATE_FORMATTER : LONG_DATE_FORMATTER).format(date);
}

export function formatReadingTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  return `${Math.round(minutes)} min read`;
}
