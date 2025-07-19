import { Env } from '@/lib/constants/env';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses dynamic parameters
export const dynamic = "force-dynamic";

// Helper to create error response
function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

// Proxy handler for all HTTP methods
async function handler(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  try {
    // Reconstruct the path
    const path = params.path?.join('/') || '';
    const targetUrl = `${Env.API_PROXY_TARGET}/${path}`;

    // Get query parameters
    const queryString = request.nextUrl.search;
    const fullUrl = `${targetUrl}${queryString}`;

    // Prepare headers
    const headers = new Headers();

    // Copy relevant headers from the incoming request
    const headersToForward = [
      "content-type",
      "accept",
      "accept-language",
      "user-agent",
      "referer",
      "authorization", // Important: forward authorization header for Supabase tokens
    ];

    headersToForward.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // Forward cookies
    const cookies = request.headers.get("cookie");
    if (cookies) {
      headers.set("cookie", cookies);
    }

    // Prepare request options
    const options: RequestInit = {
      method: request.method,
      headers,
      // Include credentials for cookie handling
      credentials: "include",
    };

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          const body = await request.json();
          options.body = JSON.stringify(body);
        } catch {
          // If JSON parsing fails, try to get raw body
          options.body = await request.text();
        }
      } else {
        // For other content types, forward as-is
        options.body = await request.text();
      }
    }

    // Make the proxy request
    const response = await fetch(fullUrl, options);

    // Create response with proxied data
    const responseHeaders = new Headers();

    // Forward specific headers from the target response
    const headersToReturn = [
      "content-type",
      "cache-control",
      "etag",
      "last-modified",
    ];

    headersToReturn.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    // IMPORTANT: Forward Set-Cookie headers for session management
    const setCookieHeaders = response.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      responseHeaders.append('set-cookie', cookie);
    });

    // Handle different response types
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // For non-JSON responses, return as-is
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return errorResponse(
      `Proxy error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      500
    );
  }
}

// Export handlers for all HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
