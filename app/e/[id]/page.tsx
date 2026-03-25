import { Env } from '@/lib/constants/env';
import { getAbsoluteAppUrl } from '@/lib/utils/app-url';
import {
  buildEventSocialImageUrl,
  formatEventSeoDescription,
  formatEventSeoTitle,
} from '@/lib/utils/event-social-metadata';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { ResolvingMetadata } from 'next';
import EventDetailPageClient from './page-client';

function getEventMetadataClient() {
  if (!Env.NEXT_PUBLIC_SUPABASE_URL || !Env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn('Skipping event metadata lookup because Supabase env vars are missing');
    return null;
  }

  return createClient(Env.NEXT_PUBLIC_SUPABASE_URL, Env.SUPABASE_SERVICE_ROLE_KEY);
}

// Define the types for props and params
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata) {
  const eventId = params.id;
  const eventPath = `/e/${eventId}`;
  const eventUrl = getAbsoluteAppUrl(eventPath);

  const previousImages = (await parent).openGraph?.images || [];
  const fallbackOgImage = buildEventSocialImageUrl(eventId);

  try {
    const supabase = getEventMetadataClient();

    if (!supabase) {
      return getDefaultMetadata(previousImages, eventUrl, fallbackOgImage);
    }

    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, cover, updated_at')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    if (!data) {
      logger.info('No event found for ID', { eventId });
      return getDefaultMetadata(previousImages, eventUrl, fallbackOgImage);
    }

    const event = data;
    const title = formatEventSeoTitle(event.title);
    const descText = formatEventSeoDescription(event.description);
    const eventOgImage = buildEventSocialImageUrl(eventId, {
      updatedAt: event.updated_at,
      title: event.title,
      cover: event.cover,
    });

    return {
      title: {
        absolute: title,
      },
      keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
      alternates: {
        canonical: eventUrl,
      },
      description: descText,
      openGraph: {
        url: eventUrl,
        locale: 'en_US',
        type: 'website',
        siteName: 'Evento',
        title: title,
        description: descText,
        images: [
          {
            url: eventOgImage,
            width: 1200,
            height: 630,
            alt: title,
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
        description: descText,
        creator: '@evento_so',
        images: [eventOgImage],
      },
    };
  } catch (error) {
    logger.error('Error fetching event data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultMetadata(previousImages, eventUrl, fallbackOgImage);
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
export const revalidate = 0;

export default async function EventDetailPage() {
  return <EventDetailPageClient />;
}
