import { Env } from '@/lib/constants/env';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses dynamic parameters
export const dynamic = 'force-dynamic';

// Helper to create error response
function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

// Proxy handler for all HTTP methods
async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Reconstruct the path
  const path = params.path?.join('/') || '';
  const targetUrl = `${Env.API_PROXY_TARGET}/${path}`;

  // Get query parameters
  const queryString = request.nextUrl.search;
  const fullUrl = `${targetUrl}${queryString}`;

  try {
    // Extract request context for logging
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Log the incoming request
    // logger.logApiRequest(fullUrl, {
    //   requestId,
    //   method: request.method,
    //   headers: Object.fromEntries(request.headers.entries()),
    //   userAgent,
    //   ip,
    // });

    // Prepare headers
    const headers = new Headers();

    // Copy relevant headers from the incoming request
    const headersToForward = [
      'content-type',
      'accept',
      'accept-language',
      'user-agent',
      'referer',
      'authorization', // Important: forward authorization header for Supabase tokens
    ];

    headersToForward.forEach((header) => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // Forward cookies
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers.set('cookie', cookies);
    }

    // Prepare request options
    const options: RequestInit = {
      method: request.method,
      headers,
      // Include credentials for cookie handling
      credentials: 'include',
    };

    // Add body for non-GET requests
    let requestBody = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          requestBody = await request.json();
          options.body = JSON.stringify(requestBody);
        } catch {
          // If JSON parsing fails, try to get raw body
          const textBody = await request.text();
          requestBody = textBody;
          options.body = textBody;
        }
      } else if (
        contentType?.includes('image/') ||
        contentType?.includes('application/octet-stream') ||
        contentType?.includes('multipart/form-data')
      ) {
        // Handle binary data (images, files)
        const arrayBuffer = await request.arrayBuffer();
        options.body = arrayBuffer;
        requestBody = `[Binary data: ${arrayBuffer.byteLength} bytes]`;
      } else {
        // For other content types, forward as text
        requestBody = await request.text();
        options.body = requestBody;
      }

      // Log request body for debugging
      if (
        requestBody &&
        process.env.NODE_ENV === 'development' &&
        Env.API_PROXY_LOG_BODIES === 'true'
      ) {
        console.debug(`Request body for ${fullUrl}:`, {
          requestId,
          body: requestBody,
        });
      }
    }

    // Make the proxy request
    const response = await fetch(fullUrl, options);

    // Create response with proxied data
    const responseHeaders = new Headers();

    // Forward specific headers from the target response
    const headersToReturn = ['content-type', 'cache-control', 'etag', 'last-modified'];

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
    const duration = Date.now() - startTime;
    let bodySize = 0;

    if (contentType?.includes('application/json')) {
      const responseData = await response.json();
      bodySize = JSON.stringify(responseData).length;

      // Log successful response
      // logger.logApiResponse(fullUrl, {
      //   requestId,
      //   statusCode: response.status,
      //   headers: Object.fromEntries(response.headers.entries()),
      //   body: responseData,
      //   bodySize,
      //   duration,
      // });

      return NextResponse.json(responseData, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // For non-JSON responses, return as-is
      const responseText = await response.text();
      bodySize = responseText.length;

      // Log successful response
      // logger.logApiResponse(fullUrl, {
      //   requestId,
      //   statusCode: response.status,
      //   headers: Object.fromEntries(response.headers.entries()),
      //   bodySize,
      //   duration,
      // });

      return new NextResponse(responseText, {
        status: response.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log comprehensive error information
    console.error('API Proxy Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      method: request.method,
      url: fullUrl || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      duration,
      targetUrl: Env.API_PROXY_TARGET,
      pathParams: params.path,
      queryString: request.nextUrl.search,
    });

    return errorResponse(
      `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
