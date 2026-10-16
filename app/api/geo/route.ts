import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get user's country from Vercel geo headers
 * Vercel automatically adds geo headers in production
 */
export async function GET(request: NextRequest) {
  // Only trust the platform-injected geo header; this feeds US funding-region
  // gating, so spoofable client-supplied headers must not be honored.
  const country = request.headers.get('x-vercel-ip-country') || null;
  const city = request.headers.get('x-vercel-ip-city') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;

  return NextResponse.json({
    country: country?.toUpperCase() ?? null,
    city,
    region,
  });
}
