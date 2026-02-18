import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Evento Cover';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const NO_COVER_FALLBACK =
  'https://api.evento.so/storage/v1/render/image/public/cdn/eventos/default-covers/tech/15.webp';

function renderFallbackEventImage(title: string) {
  return new ImageResponse(
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
    </div>,
    {
      ...size,
    }
  );
}

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: event, error } = await supabase
    .from('events')
    .select('cover, title')
    .eq('id', params.id)
    .single();

  if (error || !event) {
    logger.error('Error fetching event for OG image', {
      eventId: params.id,
      error: error?.message,
    });
    return renderFallbackEventImage('Evento Event');
  }

  const eventTitle = event.title || 'Evento Event';

  const getProperURL = (url?: string) => {
    if (!url) return NO_COVER_FALLBACK;

    if (!url.includes('https')) {
      let normalizedUrl = url;

      if (url.toLowerCase().includes('.webp')) {
        normalizedUrl = url.replace(/\.webp/i, '.png');
      }

      return `https://api.evento.so/storage/v1/object/public/cdn${normalizedUrl}?width=800&height=800`;
    }

    return url;
  };

  const [fontDataMedium, fontDataSemiBold] = await Promise.all([
    fetch(new URL('../../../public/assets/fonts/WorkSans-Medium.ttf', import.meta.url)).then(
      (res) => res.arrayBuffer()
    ),
    fetch(new URL('../../../public/assets/fonts/WorkSans-SemiBold.ttf', import.meta.url)).then(
      (res) => res.arrayBuffer()
    ),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        background: 'white',
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '40px',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderRadius: '18px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <img
          src={getProperURL(event.cover)}
          alt={eventTitle}
          style={{
            width: '450px',
            height: '450px',
            objectFit: 'cover',
            borderRadius: '18px',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '50%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <img
            src='https://app.evento.so/assets/img/evento-logo.svg'
            alt='Evento'
            style={{
              width: '250px',
              height: '30px',
            }}
          />
        </div>

        <h1
          style={{
            marginBottom: '32px',
            fontFamily: 'Work Sans',
            fontSize: '36px',
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: 1.2,
          }}
        >
          {eventTitle}
        </h1>

        <div
          style={{
            display: 'flex',
            marginTop: '32px',
            padding: '16px 24px',
            width: '250px',
            backgroundColor: '#dc2626',
            color: 'white',
            fontFamily: 'Work Sans',
            fontSize: '18px',
            fontWeight: 500,
            borderRadius: '12px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          RSVP NOW
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'Work Sans',
          data: fontDataMedium,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Work Sans',
          data: fontDataSemiBold,
          style: 'normal',
          weight: 600,
        },
      ],
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
