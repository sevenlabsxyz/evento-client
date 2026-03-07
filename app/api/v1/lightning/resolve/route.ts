import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolves a lightning address to its LNURL-pay details (server-side).
 * Used as a fallback when the Breez SDK cannot resolve the address client-side.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lightningAddress } = body;

    if (!lightningAddress) {
      return NextResponse.json({ error: 'Lightning address is required' }, { status: 400 });
    }

    const [username, domain] = lightningAddress.split('@');

    if (!username || !domain) {
      return NextResponse.json({ error: 'Invalid lightning address format' }, { status: 400 });
    }

    // Fetch LNURL-pay endpoint from well-known URL
    const wellKnownUrl = `https://${domain}/.well-known/lnurlp/${username}`;
    const lnurlResponse = await fetch(wellKnownUrl);

    if (!lnurlResponse.ok) {
      logger.error('Failed to fetch LNURL endpoint', {
        status: lnurlResponse.status,
        address: lightningAddress,
      });
      return NextResponse.json(
        { error: 'Lightning address not found or unreachable' },
        { status: 404 }
      );
    }

    const lnurlData = await lnurlResponse.json();

    if (lnurlData.status === 'ERROR') {
      return NextResponse.json(
        { error: lnurlData.reason || 'Lightning address returned an error' },
        { status: 400 }
      );
    }

    if (lnurlData.tag !== 'payRequest') {
      return NextResponse.json(
        { error: 'Invalid LNURL response: not a pay request' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      minSendable: lnurlData.minSendable || 1000,
      maxSendable: lnurlData.maxSendable || 1000000000000,
      commentAllowed: lnurlData.commentAllowed || 0,
      metadata: lnurlData.metadata || null,
      callback: lnurlData.callback,
    });
  } catch (error) {
    logger.error('Lightning address resolve error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to resolve lightning address' }, { status: 500 });
  }
}
