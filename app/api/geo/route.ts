import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get user's country from Vercel geo headers
 * Vercel automatically adds geo headers in production
 */
export async function GET(request: NextRequest) {
  // Get country from Vercel geo headers
  // https://vercel.com/docs/edge-network/headers#x-vercel-ip-country
  const country = request.headers.get('x-vercel-ip-country') || null;
  const city = request.headers.get('x-vercel-ip-city') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;

  return NextResponse.json({
    country,
    city,
    region,
  });
}
