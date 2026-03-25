import { NO_COVER_FALLBACK } from '@/lib/constants/default-covers';
import { Env } from '@/lib/constants/env';
import { resolveEventSocialCoverUrl } from '@/lib/utils/event-social-metadata';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { ImageResponse } from 'next/og';

export const EVENT_SOCIAL_IMAGE_HEADERS = {
  'Cache-Control': 'public, no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'public, no-store, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, no-store, max-age=0, must-revalidate',
};

export const eventSocialImageSize = {
  width: 1200,
  height: 630,
};

function getEventImageClient() {
  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Skipping event OG image lookup because Supabase env vars are missing');
    return null;
  }

  return createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);
}

function renderFallbackEventImage(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#111827',
          color: '#f9fafb',
          padding: '64px',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: '44px',
            fontWeight: 700,
          }}
        >
          Evento
        </div>
        <div
          style={{
            fontSize: '58px',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      ...eventSocialImageSize,
      headers: EVENT_SOCIAL_IMAGE_HEADERS,
    }
  );
}

function renderEventImage(title: string, coverSrc?: string | null) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#f4f0e8',
          color: '#18181b',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            padding: '36px',
            gap: '36px',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '45%',
              minWidth: '45%',
              height: '100%',
              borderRadius: '28px',
              overflow: 'hidden',
              backgroundColor: '#18181b',
              alignItems: 'center',
              justifyContent: 'center',
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
                  background:
                    'linear-gradient(135deg, rgba(24,24,27,1) 0%, rgba(127,29,29,1) 100%)',
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '8px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '10px 16px',
                borderRadius: '999px',
                backgroundColor: '#18181b',
                color: '#fafafa',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              Evento
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  color: '#18181b',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 700,
                }}
              >
                RSVP on app.evento.so
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                color: '#52525b',
                fontSize: '24px',
                fontWeight: 500,
              }}
            >
              Events made social
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...eventSocialImageSize,
      headers: EVENT_SOCIAL_IMAGE_HEADERS,
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
      return renderFallbackEventImage('Evento Event');
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
      return renderFallbackEventImage('Evento Event');
    }

    const eventTitle = event.title?.trim() || 'Evento Event';
    const coverUrl = resolveEventSocialCoverUrl(event.cover || NO_COVER_FALLBACK);
    const coverDataUrl = await fetchImageAsDataUrl(coverUrl);

    return renderEventImage(eventTitle, coverDataUrl);
  } catch (error) {
    logger.error('Unexpected error rendering event OG image', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
    });
    return renderFallbackEventImage('Evento Event');
  }
}
