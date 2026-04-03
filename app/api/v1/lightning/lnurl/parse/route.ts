import { logger } from '@/lib/utils/logger';
import { bech32 } from 'bech32';
import { NextRequest, NextResponse } from 'next/server';

interface LnurlParseRequest {
  lnurl: string;
}

interface LnurlWithdrawResponse {
  type: 'lnurlWithdraw';
  callback: string;
  k1: string;
  minWithdrawable: number;
  maxWithdrawable: number;
  defaultDescription: string;
}

interface LnurlPayResponse {
  type: 'lnurlPay';
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  commentAllowed?: number;
}

type LnurlParseResponse = LnurlWithdrawResponse | LnurlPayResponse;

/**
 * Decode LNURL bech32 string to get the callback URL
 */
function decodeLnurl(lnurl: string): string {
  // Remove lightning: prefix if present
  const clean = lnurl.replace(/^lightning:/i, '');

  // Decode bech32 with lnurl prefix
  const decoded = bech32.decode(clean, 1000);
  const url = Buffer.from(bech32.fromWords(decoded.words)).toString('utf8');
  return url;
}

/**
 * Validate if string is a valid LNURL
 */
function isValidLnurl(lnurl: string): boolean {
  if (!lnurl || typeof lnurl !== 'string') return false;

  // Remove lightning: prefix if present
  const clean = lnurl.replace(/^lightning:/i, '');

  // Check if it starts with lnurl (case insensitive)
  return /^lnurl/i.test(clean);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LnurlParseRequest;
    const { lnurl } = body;

    if (!lnurl) {
      return NextResponse.json({ error: 'LNURL is required' }, { status: 400 });
    }

    if (!isValidLnurl(lnurl)) {
      return NextResponse.json({ error: 'Invalid LNURL format' }, { status: 400 });
    }

    // Decode LNURL to get callback URL
    let callbackUrl: string;
    try {
      callbackUrl = decodeLnurl(lnurl);
    } catch (error) {
      logger.error('Failed to decode LNURL', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: 'Failed to decode LNURL' }, { status: 400 });
    }

    // Validate the decoded URL is from an allowed domain
    const ALLOWED_DOMAINS = ['api.zebedee.io', 'api.zbdpay.com'];
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(callbackUrl);
      const hostname = validatedUrl.hostname.toLowerCase();
      if (!ALLOWED_DOMAINS.some(domain => hostname === domain)) {
        logger.warn('LNURL callback domain not in allowlist', { hostname, allowed: ALLOWED_DOMAINS });
        return NextResponse.json({ error: 'LNURL service domain not allowed' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid callback URL in LNURL' }, { status: 400 });
    }
    try {
      new URL(callbackUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid callback URL in LNURL' }, { status: 400 });
    }

    // Fetch LNURL details from callback URL
    let lnurlData: Record<string, unknown>;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error('Failed to fetch LNURL callback', {
          status: response.status,
          url: callbackUrl,
        });
        return NextResponse.json(
          { error: 'Failed to fetch LNURL details from service' },
          { status: 502 }
        );
      }

      lnurlData = (await response.json()) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout while fetching LNURL details' },
          { status: 504 }
        );
      }
      logger.error('Error fetching LNURL callback', {
        error: error instanceof Error ? error.message : String(error),
        url: callbackUrl,
      });
      return NextResponse.json({ error: 'Failed to fetch LNURL details' }, { status: 502 });
    }

    // Check for LNURL error response
    if (lnurlData.status === 'ERROR') {
      return NextResponse.json(
        { error: (lnurlData.reason as string) || 'LNURL service returned an error' },
        { status: 400 }
      );
    }

    // Determine LNURL type based on tag
    const tag = lnurlData.tag as string | undefined;

    if (tag === 'withdrawRequest') {
      // LNURL Withdraw
      const response: LnurlWithdrawResponse = {
        type: 'lnurlWithdraw',
        callback: String(lnurlData.callback || callbackUrl),
        k1: String(lnurlData.k1 || ''),
        minWithdrawable: Number(lnurlData.minWithdrawable || 0),
        maxWithdrawable: Number(lnurlData.maxWithdrawable || 0),
        defaultDescription: String(lnurlData.defaultDescription || ''),
      };

      // Validate required fields
      if (!response.k1) {
        return NextResponse.json(
          { error: 'Invalid LNURL withdraw: missing k1 parameter' },
          { status: 400 }
        );
      }

      return NextResponse.json(response);
    } else if (tag === 'payRequest') {
      // LNURL Pay
      const response: LnurlPayResponse = {
        type: 'lnurlPay',
        callback: String(lnurlData.callback || callbackUrl),
        minSendable: Number(lnurlData.minSendable || 0),
        maxSendable: Number(lnurlData.maxSendable || 0),
        metadata: String(lnurlData.metadata || ''),
        commentAllowed: lnurlData.commentAllowed ? Number(lnurlData.commentAllowed) : undefined,
      };

      return NextResponse.json(response);
    } else {
      // Unknown or unsupported LNURL type
      return NextResponse.json(
        { error: `Unsupported LNURL type: ${tag || 'unknown'}` },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('LNURL parse error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error while parsing LNURL' },
      { status: 500 }
    );
  }
}
