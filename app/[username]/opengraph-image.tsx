import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { ImageResponse } from 'next/og';

const supabase = createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);

export const runtime = 'edge';
export const alt = 'User Profile Image';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

function renderFallbackProfileImage(username: string) {
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
          @{username}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

export default async function Image({ params }: { params: { username: string } }) {
  const { data: user, error } = await supabase
    .from('user_details')
    .select('image, username')
    .eq('username', params.username)
    .single();

  if (error || !user) {
    logger.error('Error fetching user for OG image', {
      username: params.username,
      error: error?.message,
    });
    return renderFallbackProfileImage(params.username);
  }

  const getProperURL = (url?: string) => {
    if (!url) return null;

    if (!url.includes('https://')) {
      return `https://api.evento.so/storage/v1/object/public/cdn${url}?width=400&height=400`;
    }

    return url;
  };

  const profileImageUrl = getProperURL(user.image);

  return new ImageResponse(
    (
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={user.username}
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '26px',
              }}
            />
          ) : (
            <div
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '26px',
                backgroundColor: '#111827',
                color: '#f9fafb',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '52px',
                fontWeight: 700,
              }}
            >
              @{user.username.slice(0, 2).toUpperCase()}
            </div>
          )}
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
              justifyContent: 'flex-end',
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
              fontSize: '64px',
              fontWeight: 600,
              color: '#222',
            }}
          >
            @{user.username}
          </h1>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            View events on Evento
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
