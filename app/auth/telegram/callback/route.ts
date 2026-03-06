import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const redirectUrl = new URL('/api/auth/telegram/callback', request.nextUrl.origin);
  redirectUrl.search = request.nextUrl.search;
  return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
}
