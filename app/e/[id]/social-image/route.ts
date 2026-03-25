import { EVENT_SOCIAL_IMAGE_HEADERS, renderEventSocialImage } from '@/lib/og/event-social-image';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const response = await renderEventSocialImage(params.id);

  Object.entries(EVENT_SOCIAL_IMAGE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
