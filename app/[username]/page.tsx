import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { shouldBypassUsernameRoute } from '@/lib/utils/public-asset-paths';
import { createClient } from '@supabase/supabase-js';
import type { Metadata, ResolvingMetadata } from 'next';
import { getTranslations } from 'next-intl/server';
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

  const t = await getTranslations('profile');
  const profilePath = `/${username}`;
  const profileOgImage = `${profilePath}/opengraph-image`;

  // fallback to parent SEO metadata image details
  const previousImages = (await parent).openGraph?.images || [];

  // NOTE: user profiles have no privacy/visibility concept in the data model
  // (UserDetails in lib/types/api.ts — username/name/image are public handles),
  // so the profile metadata fetch stays unfiltered. Missing users fall back to
  // generic noindex metadata below.
  try {
    const supabase = getProfileMetadataClient();

    if (!supabase) {
      return getDefaultMetadata(
        t('metadata.defaultDescription'),
        previousImages,
        profilePath,
        profileOgImage
      );
    }

    const { data: user, error } = await supabase
      .from('user_details')
      .select('name, username, image')
      .eq('username', username)
      .single();

    if (error) throw error;

    if (!user) {
      logger.info('No user found for username', { username });
      return getDefaultMetadata(
        t('metadata.defaultDescription'),
        previousImages,
        profilePath,
        profileOgImage
      );
    }

    const title = user.name
      ? t('metadata.titleWithName', { name: user.name, username: user.username })
      : t('metadata.title', { username: user.username });
    const description = t('metadata.description', {
      name: user.name || `@${user.username}`,
    });

    return {
      title: { absolute: title },
      keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
      alternates: {
        canonical: profilePath,
      },
      description,
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
            alt: t('metadata.ogAlt', { name: user.name || user.username }),
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
        description,
        creator: '@evento_so',
        images: [profileOgImage],
      },
    };
  } catch (error) {
    logger.error('Error fetching user data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultMetadata(
      t('metadata.defaultDescription'),
      previousImages,
      profilePath,
      profileOgImage
    );
  }
}

// Generic metadata for missing profiles (noindex so nonexistent usernames
// don't index placeholder pages; real profiles index via generateMetadata).
function getDefaultMetadata(
  description: string,
  previousImages: any[],
  canonicalPath = '/',
  fallbackImage?: string
) {
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
    description,
    openGraph: {
      url: canonicalPath,
      images: openGraphImages,
    },
    robots: {
      index: false,
      follow: true,
      nocache: true,
    },
    twitter: fallbackImage ? { card: 'summary_large_image', images: [fallbackImage] } : undefined,
  };
}

export const dynamic = 'force-dynamic';

export default function Page({ params }: UsernamePageProps) {
  if (shouldBypassUsernameRoute(params.username)) {
    notFound();
  }

  return <UserProfilePageClient username={params.username} />;
}
