import { Env } from '@/lib/constants/env';
import { logger } from '@/lib/utils/logger';
import { NextResponse } from 'next/server';

// Use the backend target URL directly for server-side requests
const API_BASE_URL = Env.API_PROXY_TARGET;

export async function apiRequest(
  method: string,
  path: string,
  request: Request
) {
  const requestId = logger.generateRequestId();
  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const queryString = url.search;
    const targetUrl = `${API_BASE_URL}${path}${queryString}`;

    // Extract request context for logging
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Get cookies from the incoming request
    const cookieHeader = request.headers.get('cookie') || '';

    // Prepare headers for the backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    };

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    // Add body for POST/PATCH/PUT requests
    let requestBody = undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        requestBody = await request.json();
        options.body = JSON.stringify(requestBody);
      } catch {
        // No body or invalid JSON
      }
    }

    // Log the API request
    logger.logApiRequest(targetUrl, {
      requestId,
      method,
      headers: Object.fromEntries(request.headers.entries()),
      body: requestBody,
      userAgent,
      ip,
    });

    // Make the request to the backend
    const response = await fetch(targetUrl, options);

    // Get the response body
    let data;
    const contentType = response.headers.get('content-type');
    const duration = Date.now() - startTime;
    let bodySize = 0;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      bodySize = JSON.stringify(data).length;
    } else {
      data = await response.text();
      bodySize = data.length;
    }

    // Log the API response
    logger.logApiResponse(targetUrl, {
      requestId,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: data,
      bodySize,
      duration,
    });

    // Create the response with the same status
    const proxyResponse = NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward Set-Cookie headers if any
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      proxyResponse.headers.set('set-cookie', setCookieHeader);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return proxyResponse;
  } catch (error) {
    const duration = Date.now() - startTime;
    const targetUrl = `${API_BASE_URL}${path}${new URL(request.url).search}`;

    // Log comprehensive error information
    logger.logApiError(
      targetUrl,
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId,
        method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        additionalContext: {
          duration,
          apiBaseUrl: API_BASE_URL,
          requestPath: path,
          queryString: new URL(request.url).search,
          cookiePresent: !!request.headers.get('cookie'),
        },
      }
    );

    return NextResponse.json(
      {
        error: 'Failed to proxy request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
