import { apiRequest } from '@/lib/api/api-request';

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return apiRequest('GET', '/v1/events/gallery', request);
}
