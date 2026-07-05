import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get user's country from Vercel geo headers
 * Vercel automatically adds geo headers in production
 */
export async function GET(request: NextRequest) {
  // Prefer deployment/provider geo headers when available.
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    null;
  const city = request.headers.get('x-vercel-ip-city') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;

  return NextResponse.json({
    country: country?.toUpperCase() ?? null,
    city,
    region,
  });
}
