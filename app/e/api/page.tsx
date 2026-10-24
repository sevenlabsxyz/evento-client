import type { Metadata } from 'next';
import ApiPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Evento API — Build on top of your events',
  description:
    'Fetch public events, organizer feeds, and RSVP guest lists with the Evento Public API, or embed events anywhere with the no-auth, CORS-enabled Embed API.',
};

export default function ApiPage() {
  return <ApiPageClient />;
}
