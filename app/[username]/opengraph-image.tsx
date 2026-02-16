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
    return new Response('Error generating image', { status: 500 });
  }

  const getProperURL = (url?: string) => {
    if (!url) {
      return 'https://api.evento.so/storage/v1/object/public/cdn/default-avatar.png?width=400&height=400';
    }

    if (!url.includes('https://')) {
      return `https://api.evento.so/storage/v1/object/public/cdn${url}?width=400&height=400`;
    }

    return url;
  };

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
          <img
            src={getProperURL(user.image)}
            alt={user.username}
            style={{
              width: '300px',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '26px',
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
              justifyContent: 'flex-end',
            }}
          >
            <img
              src='https://evento.so/assets/img/evento-logo.svg'
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
