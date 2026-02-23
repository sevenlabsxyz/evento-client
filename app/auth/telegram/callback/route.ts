import { Env } from '@/lib/constants/env';
import { NextRequest, NextResponse } from 'next/server';

function resolveApiOrigin(): string {
  const candidates = [Env.API_PROXY_TARGET, Env.NEXT_PUBLIC_API_URL];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      try {
        return new URL(candidate).origin;
      } catch {
        continue;
      }
    }
  }

  return 'https://evento.so';
}

export async function GET(request: NextRequest) {
  const apiOrigin = resolveApiOrigin();
  const upstreamUrl = new URL('/auth/telegram/callback', apiOrigin);
  upstreamUrl.search = request.nextUrl.search;

  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const upstreamHeaders = new Headers();
  if (hostHeader) {
    upstreamHeaders.set('x-original-domain', hostHeader);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers: upstreamHeaders,
    redirect: 'manual',
  });

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
    const location = upstreamResponse.headers.get('location');
    if (location) {
      return NextResponse.redirect(new URL(location, apiOrigin), upstreamResponse.status);
    }
  }

  const body = await upstreamResponse.text();
  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: {
      'content-type': upstreamResponse.headers.get('content-type') || 'text/plain',
    },
  });
}
