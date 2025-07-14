import { apiRequest } from '@/lib/api/api-request';

export async function GET(request: Request) {
  return apiRequest('GET', '/v1/events/details', request);
}