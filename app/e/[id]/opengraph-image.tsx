import { eventSocialImageSize, renderEventSocialImage } from '@/lib/og/event-social-image';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const alt = 'Evento Cover';
export const size = eventSocialImageSize;
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  return renderEventSocialImage(params.id);
}
