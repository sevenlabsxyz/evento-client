import { NextResponse } from "next/server";

// Use the backend target URL directly for server-side requests
const API_BASE_URL =
  process.env.API_PROXY_TARGET || "http://localhost:3002/api";

export async function apiRequest(
  method: string,
  path: string,
  request: Request,
) {
  try {
    const url = new URL(request.url);
    const queryString = url.search;
    const targetUrl = `${API_BASE_URL}${path}${queryString}`;

    // Get cookies from the incoming request
    const cookieHeader = request.headers.get("cookie") || "";

    // Prepare headers for the backend request
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    };

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    // Add body for POST/PATCH/PUT requests
    if (method !== "GET" && method !== "DELETE") {
      try {
        const body = await request.json();
        options.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON
      }
    }

    // Make the request to the backend
    const response = await fetch(targetUrl, options);

    // Get the response body
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Create the response with the same status
    const proxyResponse = NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward Set-Cookie headers if any
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      proxyResponse.headers.set("set-cookie", setCookieHeader);
    }

    return proxyResponse;
  } catch (error) {
    console.error("API proxy error:", error);
    console.error("Target URL was:", `${API_BASE_URL}${path}`);
    return NextResponse.json(
      {
        error: "Failed to proxy request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
