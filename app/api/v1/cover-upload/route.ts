import { apiRequest } from "@/lib/api/api-request";

// Mark this route as dynamic since it uses request.url
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return apiRequest("POST", "/v1/cover-upload", request);
}
