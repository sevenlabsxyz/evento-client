import apiClient from '@/lib/api/client';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { Metadata, ResolvingMetadata } from 'next';
import EventDetailPageClient from './page-client';

// Define the types for props and params
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the event page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the event ID from params
  const eventId = params.id;

  try {
    // Fetch event data from API
    const eventResponse = await apiClient.get(
      `/v1/events/details?id=${eventId}`
    );
    const eventData = eventResponse.data;

    if (!eventData?.data || !eventData?.data[0]) {
      return {
        title: 'Event Not Found',
        description: 'The event you are looking for does not exist.',
      };
    }

    const event = eventData.data[0];

    // Fetch hosts data
    const hostsResponse = await apiClient.get(`/v1/events/hosts?id=${eventId}`);
    const hostsData = hostsResponse.data;
    const hosts = hostsData?.data || [];

    // Fetch gallery data
    const galleryResponse = await apiClient.get(
      `/v1/events/gallery?id=${eventId}`
    );
    const galleryData = galleryResponse.data;
    const gallery = galleryData?.data || [];

    // Transform API data to display format
    const transformedEvent = transformApiEventToDisplay(event, hosts, gallery);

    // Default image is first cover image or a fallback
    const coverImage =
      transformedEvent.coverImages?.[0] || '/assets/default-event-cover.jpg';

    // Generate metadata
    return {
      title: `${transformedEvent.title} | Evento`,
      description: transformedEvent.description || 'Join this event on Evento',
      openGraph: {
        title: transformedEvent.title,
        description:
          transformedEvent.description || 'Join this event on Evento',
        images: [
          {
            url: coverImage,
            width: 1200,
            height: 630,
            alt: transformedEvent.title,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: transformedEvent.title,
        description:
          transformedEvent.description || 'Join this event on Evento',
        images: [coverImage],
        creator: '@evento',
      },
    };
  } catch (error) {
    console.error('Error generating event metadata:', error);
    return {
      title: 'Event | Evento',
      description: 'Join this event on Evento',
    };
  }
}

export default async function EventDetailPage({ params }: Props) {
  // Server component simply renders the client component
  // All metadata is handled by generateMetadata function
  return <EventDetailPageClient />;
}
