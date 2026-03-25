import { NO_COVER_FALLBACK } from '@/lib/constants/default-covers';
import { getAbsoluteAppUrl } from '@/lib/utils/app-url';
import { getCoverImageLarge } from '@/lib/utils/cover-images';

const DEFAULT_EVENT_DESCRIPTION = 'Events made social - evento.so';

function hashVersionSeed(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

export function formatEventSeoTitle(title?: string | null) {
  const trimmedTitle = title?.trim();

  if (!trimmedTitle || trimmedTitle === 'Untitled Event') {
    return 'RSVP on Evento Now';
  }

  return `${trimmedTitle} - Evento`;
}

export function formatEventSeoDescription(description?: string | null) {
  const cleanDescription = description
    ? description
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/p>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  if (!cleanDescription) {
    return DEFAULT_EVENT_DESCRIPTION;
  }

  return cleanDescription.slice(0, 250) + (cleanDescription.length > 250 ? '...' : '');
}

type EventSocialVersionInput = {
  updatedAt?: string | null;
  title?: string | null;
  cover?: string | null;
};

export function getSocialImageVersion({ updatedAt, title, cover }: EventSocialVersionInput = {}) {
  const versionSeed = [updatedAt || '', title?.trim() || '', cover || ''].join('|');
  const contentHash = hashVersionSeed(versionSeed);
  const updatedAtMs = updatedAt ? Date.parse(updatedAt) : Number.NaN;

  if (Number.isNaN(updatedAtMs)) {
    return contentHash;
  }

  return `${updatedAtMs}-${contentHash}`;
}

export function buildEventSocialImageUrl(eventId: string, versionInput?: EventSocialVersionInput) {
  const url = new URL(`/e/${eventId}/social-image`, getAbsoluteAppUrl('/'));
  const version = getSocialImageVersion(versionInput);

  if (version) {
    url.searchParams.set('v', version);
  }

  return url.toString();
}

export function resolveEventSocialCoverUrl(cover?: string | null) {
  if (!cover) {
    return NO_COVER_FALLBACK;
  }

  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return cover;
  }

  return getCoverImageLarge(cover);
}
