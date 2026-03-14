import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { shouldBypassUsernameRoute } from '@/lib/utils/public-asset-paths';
import { createClient } from '@supabase/supabase-js';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import UserProfilePageClient from './page-client';

function getProfileMetadataClient() {
  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Skipping profile metadata lookup because Supabase env vars are missing');
    return null;
  }

  return createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);
}

interface UsernamePageProps {
  params: {
    username: string;
  };
}

export async function generateMetadata(
  { params }: UsernamePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { username } = params;

  if (shouldBypassUsernameRoute(username)) {
    notFound();
  }

  const profilePath = `/${username}`;
  const profileOgImage = `${profilePath}/opengraph-image`;

  // fallback to parent SEO metadata image details
  const previousImages = (await parent).openGraph?.images || [];

  try {
    const supabase = getProfileMetadataClient();

    if (!supabase) {
      return getDefaultMetadata(previousImages, profilePath, profileOgImage);
    }

    const { data: user, error } = await supabase
      .from('user_details')
      .select('name, username, image')
      .eq('username', username)
      .single();

    if (error) throw error;

    if (!user) {
      logger.info('No user found for username', { username });
      return getDefaultMetadata(previousImages, profilePath, profileOgImage);
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
    return getDefaultMetadata(previousImages, profilePath, profileOgImage);
  }
}

function getDefaultMetadata(previousImages: any[], canonicalPath = '/', fallbackImage?: string) {
  const openGraphImages = fallbackImage
    ? [
        {
          url: fallbackImage,
          width: 1200,
          height: 630,
          alt: 'Evento',
        },
      ]
    : [...previousImages];

  return {
    title: { absolute: 'Evento' },
    keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
    alternates: { canonical: canonicalPath },
    description: 'Events made social -- evento.so',
    openGraph: {
      url: canonicalPath,
      images: openGraphImages,
    },
    twitter: fallbackImage ? { card: 'summary_large_image', images: [fallbackImage] } : undefined,
  };
}

export const dynamic = 'force-dynamic';

export default function Page({ params }: UsernamePageProps) {
  if (shouldBypassUsernameRoute(params.username)) {
    notFound();
  }

  return <UserProfilePageClient />;
}
