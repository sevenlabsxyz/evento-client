import { Env } from '@/lib/constants/env';
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

	try {
		const { data, error } = await supabase
			.from('events')
			.select('id, title, description')
			.eq('id', eventId)
			.single();

		if (error) throw error;

		if (!data) {
			console.log('No event found for ID:', eventId);
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
			},
		};
	} catch (error) {
		console.error('Error fetching event data:', error);
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
