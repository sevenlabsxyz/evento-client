import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { ResolvingMetadata } from 'next';
import EventDetailPageClient from './page-client';

// Define the types for props and params
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata) {
  // Initialize Supabase client
  const supabaseUrl = Env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = Env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the event ID from params
  const eventId = params.id;

  // fallback to parent SEO metadata image details
  const previousImages = (await parent).openGraph?.images || [];
  const eventOgImage = `https://evento.so/e/${eventId}/opengraph-image`;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    if (!data) {
      logger.info('No event found for ID', { eventId });
      return getDefaultMetadata(previousImages);
    }

    const event = data;

    const title =
      event?.title === 'Untitled Event' ? 'RSVP on Evento Now' : `${event?.title} - Evento`;
    const descText = event?.description
      ? (event.description.replace(/<[^>]*>/g, '') || '').slice(0, 250) +
        (event.description.length > 250 ? '...' : '')
      : 'Events made social - evento.so';

    return {
      title: {
        absolute: title,
      },
      keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
      alternates: {
        canonical: `https://evento.so/p/${event?.id}`,
      },
      description: descText,
      openGraph: {
        url: `https://evento.so/p/${event?.id}`,
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
        title: title,
        description: descText,
        creator: '@evento_so',
        images: [eventOgImage],
      },
    };
  } catch (error) {
    logger.error('Error fetching event data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultMetadata(previousImages);
  }
}

function getDefaultMetadata(previousImages: any[]) {
  return {
    title: { absolute: 'Evento' },
    keywords: ['events', 'partiful', 'social', 'evento', 'evento.so'],
    alternates: { canonical: `https://evento.so/` },
    description: 'Events made social -- evento.so',
    openGraph: {
      url: `https://evento.so/`,
      images: [...previousImages],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: Props) {
  // Server component simply renders the client component
  // All metadata is handled by generateMetadata function
  return <EventDetailPageClient />;
}
