import { NO_COVER_FALLBACK } from '@/lib/constants/default-covers';
import { Env } from '@/lib/constants/env';
import { resolveEventSocialCoverUrl } from '@/lib/utils/event-social-metadata';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { ImageResponse } from 'next/og';
import { join } from 'path';

export const EVENT_SOCIAL_IMAGE_HEADERS = {
  'Cache-Control': 'public, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'public, no-store, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, no-store, max-age=0, must-revalidate',
};

export const eventSocialImageSize = {
  width: 1200,
  height: 630,
};

const EVENT_TITLE_MAX_LENGTH = 62;
const EVENT_SOCIAL_COVER_SIZE = 430;
const EVENT_TITLE_WORD_BOUNDARY_BACKTRACK = 12;
const EVENT_SOCIAL_TEXT_WIDTH = 560;

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' | 'word' | 'sentence' }
) => {
  segment(input: string): Iterable<{ segment: string }>;
};

const eventSocialFontsPromise = Promise.all([
  readFile(join(process.cwd(), 'public/assets/fonts/WorkSans-Medium.ttf')),
  readFile(join(process.cwd(), 'public/assets/fonts/WorkSans-SemiBold.ttf')),
])
  .then(([medium, semibold]) => [
    {
      name: 'Work Sans',
      data: medium,
      weight: 500 as const,
      style: 'normal' as const,
    },
    {
      name: 'Work Sans',
      data: semibold,
      weight: 600 as const,
      style: 'normal' as const,
    },
  ])
  .catch((error) => {
    logger.warn('Failed to load event social image fonts', {
      error: error instanceof Error ? error.message : String(error),
    });

    return [];
  });

function EventoWordmark({ color = '#111111' }: { color?: string }) {
  return (
    <svg
      width='242'
      height='34'
      viewBox='0 0 242 34'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M0 0.7323H28.2603V8.43607H10.2896V12.3955H27.3231V20.1427H10.2896V24.1891H28.4568V31.9363H0V0.7323Z'
        fill={color}
      />
      <path
        d='M39.5346 0.7323L45.9351 21.3053L52.4825 0.7323H63.4114L51.5454 31.9363H40.2711L28.3596 0.7323H39.5346Z'
        fill={color}
      />
      <path
        d='M64.5448 0.7323H92.8051V8.43607H74.8344V12.3955H91.8679V20.1427H74.8344V24.1891H93.0016V31.9363H64.5448V0.7323Z'
        fill={color}
      />
      <path
        d='M116.783 31.9363L105.854 12.0521V31.9363H96.3529V0.7323H109.005L119.983 20.573V0.7323H129.485V31.9363H116.783Z'
        fill={color}
      />
      <path
        d='M141.694 8.43607H131.059V0.7323H162.667V8.43607H151.984V31.9363H141.694V8.43607Z'
        fill={color}
      />
      <path
        d='M180.197 32.4949C169.268 32.4949 161.487 26.5557 161.487 16.2681C161.487 5.98056 169.266 0 180.197 0C191.127 0 198.906 5.98263 198.906 16.2681C198.906 26.5536 191.127 32.4949 180.197 32.4949ZM180.197 24.9628C184.332 24.9628 188.221 22.4245 188.221 16.2681C188.221 10.1117 184.332 7.53 180.197 7.53C176.061 7.53 172.172 10.1117 172.172 16.2681C172.172 22.4245 176.061 24.9628 180.197 24.9628Z'
        fill={color}
      />
      <path
        d='M238.805 8.41953L241.711 15.662L229.016 19.3318L236.98 28.5499L229.878 33.1589L221.914 23.4713L214.382 33.161L207.172 28.554L215.135 19.336L202.652 15.6682L205.557 8.42367L217.716 12.561V0.802643H226.322V12.561L238.805 8.41953Z'
        fill={color}
      />
    </svg>
  );
}

function getEventImageClient() {
  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Skipping event OG image lookup because Supabase env vars are missing');
    return null;
  }

  return createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);
}

function getTextSegments(value: string) {
  const intlWithSegmenter = Intl as typeof Intl & {
    Segmenter?: SegmenterConstructor;
  };

  if (intlWithSegmenter.Segmenter) {
    const segmenter = new intlWithSegmenter.Segmenter(undefined, {
      granularity: 'grapheme',
    });

    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }

  return Array.from(value);
}

function truncateEventTitle(title: string, maxLength = EVENT_TITLE_MAX_LENGTH) {
  const trimmedTitle = title.trim();
  const segments = getTextSegments(trimmedTitle);

  if (segments.length <= maxLength) {
    return trimmedTitle;
  }

  const maxVisibleSegments = maxLength - 1;
  const truncatedSegments = segments.slice(0, maxVisibleSegments);
  const lastWhitespaceIndex = truncatedSegments.findLastIndex((segment) => /\s/.test(segment));
  const minWordBoundaryIndex = Math.max(
    0,
    maxVisibleSegments - EVENT_TITLE_WORD_BOUNDARY_BACKTRACK
  );

  if (lastWhitespaceIndex >= minWordBoundaryIndex) {
    return `${truncatedSegments.slice(0, lastWhitespaceIndex).join('').trimEnd()}…`;
  }

  return `${truncatedSegments.join('').trimEnd()}…`;
}

async function renderFallbackEventImage(title: string) {
  const displayTitle = truncateEventTitle(title, 54);
  const fonts = await eventSocialFontsPromise;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#111111',
        padding: '46px',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: '44px',
          fontWeight: 700,
          marginRight: 'auto',
        }}
      >
        <EventoWordmark />
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          marginBottom: 'auto',
          width: '100%',
          fontFamily: '"Work Sans"',
          fontSize: '58px',
          fontWeight: 600,
          lineHeight: 1.2,
          color: '#111111',
        }}
      >
        {displayTitle}
      </div>
    </div>,
    {
      ...eventSocialImageSize,
      headers: EVENT_SOCIAL_IMAGE_HEADERS,
      fonts,
    }
  );
}

async function renderEventImage(title: string, coverSrc?: string | null) {
  const displayTitle = truncateEventTitle(title);
  const fonts = await eventSocialFontsPromise;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#111111',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '42px 48px',
          gap: '30px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            maxWidth: `${EVENT_SOCIAL_TEXT_WIDTH}px`,
            height: `${EVENT_SOCIAL_COVER_SIZE}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '242px',
              height: '34px',
            }}
          >
            <EventoWordmark />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: `${EVENT_SOCIAL_TEXT_WIDTH}px`,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                maxWidth: `${EVENT_SOCIAL_TEXT_WIDTH}px`,
                fontFamily: '"Work Sans"',
                fontSize: '54px',
                fontWeight: 500,
                lineHeight: 1.06,
                letterSpacing: '0em',
                color: '#111111',
                overflow: 'hidden',
              }}
            >
              {displayTitle}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '28px',
                padding: '16px 42px',
                borderRadius: '999px',
                backgroundColor: '#ef3125',
                color: '#fff',
                fontFamily: '"Work Sans"',
                fontSize: '26px',
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              RSVP
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            width: `${EVENT_SOCIAL_COVER_SIZE}px`,
            minWidth: `${EVENT_SOCIAL_COVER_SIZE}px`,
            height: `${EVENT_SOCIAL_COVER_SIZE}px`,
            borderRadius: '28px',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 18px 44px rgba(0, 0, 0, 0.12)',
          }}
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, #fafafa 0%, #e5e7eb 100%)',
              }}
            />
          )}
        </div>
      </div>
    </div>,
    {
      ...eventSocialImageSize,
      headers: EVENT_SOCIAL_IMAGE_HEADERS,
      fonts,
    }
  );
}

function toBase64DataUrl(buffer: ArrayBuffer, contentType: string) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return `data:${contentType};base64,${btoa(binary)}`;
}

async function fetchImageAsDataUrl(url: string) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      logger.warn('Event OG cover fetch failed', {
        url,
        status: response.status,
      });
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    return toBase64DataUrl(await response.arrayBuffer(), contentType);
  } catch (error) {
    logger.warn('Event OG cover fetch threw an error', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function renderEventSocialImage(eventId: string) {
  try {
    const supabase = getEventImageClient();

    if (!supabase) {
      return await renderFallbackEventImage('Evento Event');
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('cover, title')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      logger.error('Error fetching event for OG image', {
        eventId,
        error: error?.message,
      });
      return await renderFallbackEventImage('Evento Event');
    }

    const eventTitle = event.title?.trim() || 'Evento Event';
    const coverUrl = resolveEventSocialCoverUrl(event.cover || NO_COVER_FALLBACK);
    const coverDataUrl = await fetchImageAsDataUrl(coverUrl);

    return await renderEventImage(eventTitle, coverDataUrl);
  } catch (error) {
    logger.error('Unexpected error rendering event OG image', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    });
    return await renderFallbackEventImage('Evento Event');
  }
}
