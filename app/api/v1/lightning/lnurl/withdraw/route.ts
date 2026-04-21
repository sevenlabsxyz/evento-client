import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

interface LnurlWithdrawRequest {
  callback: string;
  k1: string;
  invoice: string;
  amount: number;
}

interface LnurlWithdrawCallbackResponse {
  success: boolean;
  reason?: string;
  data?: {
    status: string;
    reason?: string;
  };
}

/**
 * POST handler for LNURL withdraw execution
 * Posts a bolt11 invoice to the LNURL callback URL to claim funds
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LnurlWithdrawRequest;
    const { callback, k1, invoice, amount } = body;

    // Validate required fields
    if (!callback) {
      return NextResponse.json({ error: 'Callback URL is required' }, { status: 400 });
    }

    if (!k1) {
      return NextResponse.json({ error: 'k1 parameter is required' }, { status: 400 });
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice (bolt11) is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount in millisats is required' }, { status: 400 });
    }

    // Validate callback URL is from an allowed domain
    const ALLOWED_DOMAINS = ['api.zebedee.io', 'api.zbdpay.com'];
    let callbackUrl: URL;
    try {
      callbackUrl = new URL(callback);
      const hostname = callbackUrl.hostname.toLowerCase();
      if (!ALLOWED_DOMAINS.some((domain) => hostname === domain)) {
        logger.warn('LNURL withdraw callback domain not in allowlist', {
          hostname,
          allowed: ALLOWED_DOMAINS,
        });
        return NextResponse.json({ error: 'Callback domain not allowed' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid callback URL' }, { status: 400 });
    }
    try {
      callbackUrl = new URL(callback);
    } catch {
      return NextResponse.json({ error: 'Invalid callback URL' }, { status: 400 });
    }

    // Build callback URL with query parameters per LNURL spec (LUD-03)
    // GET <callback_url>?k1=<k1>&pr=<bolt11_invoice>
    callbackUrl.searchParams.set('k1', k1);
    callbackUrl.searchParams.set('pr', invoice);

    logger.info('Executing LNURL withdraw', {
      callback: callbackUrl.toString().replace(/k1=[^&]+/, 'k1=***'), // Mask k1 for security
      amount,
    });

    // Execute the withdraw request with timeout
    let callbackResponse: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      callbackResponse = await fetch(callbackUrl.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('LNURL withdraw request timeout', {
          callback: callbackUrl.hostname,
        });
        return NextResponse.json(
          { error: 'Request timeout while executing LNURL withdraw' },
          { status: 504 }
        );
      }

      logger.error('Network error during LNURL withdraw', {
        error: error instanceof Error ? error.message : String(error),
        callback: callbackUrl.hostname,
      });
      return NextResponse.json(
        { error: 'Network error while executing LNURL withdraw' },
        { status: 502 }
      );
    }

    // Handle non-OK HTTP responses
    if (!callbackResponse.ok) {
      logger.error('LNURL callback returned error', {
        status: callbackResponse.status,
        callback: callbackUrl.hostname,
      });
      return NextResponse.json(
        { error: `LNURL service returned HTTP ${callbackResponse.status}` },
        { status: 502 }
      );
    }

    // Parse the callback response
    let responseData: { status: string; reason?: string };
    try {
      responseData = (await callbackResponse.json()) as { status: string; reason?: string };
    } catch (error) {
      logger.error('Failed to parse LNURL callback response', {
        error: error instanceof Error ? error.message : String(error),
        callback: callbackUrl.hostname,
      });
      return NextResponse.json({ error: 'Invalid response from LNURL service' }, { status: 502 });
    }

    // Check for LNURL error response
    if (responseData.status === 'ERROR') {
      const reason = responseData.reason || 'LNURL service rejected the withdraw request';
      logger.warn('LNURL withdraw rejected by service', {
        reason,
        callback: callbackUrl.hostname,
      });

      const result: LnurlWithdrawCallbackResponse = {
        success: false,
        reason,
        data: responseData,
      };
      return NextResponse.json(result, { status: 200 });
    }

    // Success response
    if (responseData.status === 'OK') {
      logger.info('LNURL withdraw executed successfully', {
        callback: callbackUrl.hostname,
        amount,
      });

      const result: LnurlWithdrawCallbackResponse = {
        success: true,
        data: responseData,
      };
      return NextResponse.json(result, { status: 200 });
    }

    // Unknown status
    logger.warn('LNURL callback returned unexpected status', {
      status: responseData.status,
      callback: callbackUrl.hostname,
    });

    const result: LnurlWithdrawCallbackResponse = {
      success: false,
      reason: `Unexpected response status: ${responseData.status}`,
      data: responseData,
    };
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error('LNURL withdraw execution error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error while executing LNURL withdraw' },
      { status: 500 }
    );
  }
}
