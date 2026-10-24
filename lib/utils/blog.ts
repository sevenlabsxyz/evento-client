import { getIntlLocale } from '@/lib/i18n/active-locale';
import { GhostPost, GhostTag } from '@/lib/types/ghost';

/** Tags used to route posts into Evento surfaces; never shown to readers. */
export const INTERNAL_BLOG_TAG_SLUGS = ['blog', 'hub'];

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
 * `locale` is an app locale (`en`, `pt-BR`, `es`); defaults to the active one.
 * Returns '' for missing or unparsable input.
 */
export function formatPostDate(
  iso: string | null,
  style: 'long' | 'short' = 'long',
  locale?: string
): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: style,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Whole reading minutes to display, or null when Ghost reports none. Render
 * with the `common.counts.minRead` message so the label is localized.
 */
export function getReadingMinutes(minutes: number): number | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.round(minutes);
}
