import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import UserProfilePageClient from './page-client';

export async function generateMetadata({ params }: any, parent: any) {
  const { username } = params;
  const profilePath = `/${username}`;
  const profileOgImage = `${profilePath}/opengraph-image`;

  const supabaseUrl = Env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = Env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // fallback to parent SEO metadata image details
  const previousImages = (await parent).openGraph?.images || [];

  try {
    const { data: user, error } = await supabase
      .from('user_details')
      .select('name, username, image')
      .eq('username', username)
      .single();

    if (error) throw error;

    if (!user) {
      logger.info('No user found for username', { username });
      return getDefaultMetadata(previousImages);
    }

    const title = user.name
      ? `${user.name} (@${user.username}) on Evento`
      : `@${user.username} on Evento`;

    return {
      title: { absolute: title },
      keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
      alternates: {
        canonical: profilePath,
      },
      description: `View all events by ${user.name || `@${user.username}`} on Evento.`,
      openGraph: {
        url: profilePath,
        locale: 'en_US',
        type: 'profile',
        siteName: 'Evento',
        images: [
          {
            url: profileOgImage,
            width: 1200,
            height: 630,
            alt: `Profile card for ${user.name || user.username}`,
          },
        ],
      },
      robots: {
        index: true,
        follow: true,
        nocache: true,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: `View all events by ${user.name || `@${user.username}`} on Evento.`,
        creator: '@evento_so',
        images: [profileOgImage],
      },
    };
  } catch (error) {
    logger.error('Error fetching user data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultMetadata(previousImages);
  }
}

function getDefaultMetadata(previousImages: any[]) {
  return {
    title: { absolute: 'Evento' },
    keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
    alternates: { canonical: '/' },
    description: 'Events made social -- evento.so',
    openGraph: {
      url: '/',
      images: [...previousImages],
    },
  };
}

export const dynamic = 'force-dynamic';

export default function Page() {
  return <UserProfilePageClient />;
}
