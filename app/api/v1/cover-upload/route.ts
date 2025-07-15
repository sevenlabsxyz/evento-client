import { apiRequest } from '@/lib/api/api-request';

export async function POST(request: Request) {
  return apiRequest('POST', '/v1/cover-upload', request);
}