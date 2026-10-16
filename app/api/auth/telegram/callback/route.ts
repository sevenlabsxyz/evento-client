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
  const upstreamUrl = new URL('/api/auth/telegram/callback', apiOrigin);
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
      // Only honor same-origin redirects; a malicious upstream could otherwise
      // bounce the user to an attacker-controlled absolute URL.
      let redirectUrl: URL;
      try {
        redirectUrl = new URL(location, apiOrigin);
      } catch {
        return NextResponse.json({ error: 'Invalid upstream redirect' }, { status: 502 });
      }

      if (redirectUrl.origin !== apiOrigin) {
        return NextResponse.json(
          { error: 'Upstream redirect to disallowed origin' },
          { status: 502 }
        );
      }

      return NextResponse.redirect(redirectUrl, 302);
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
