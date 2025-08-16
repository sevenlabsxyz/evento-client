import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lightningAddress, amountSats } = body;

    if (!lightningAddress) {
      return NextResponse.json(
        { error: 'Lightning address is required' },
        { status: 400 }
      );
    }

    if (!amountSats || amountSats <= 0) {
      return NextResponse.json(
        { error: 'Valid amount in sats is required' },
        { status: 400 }
      );
    }

    // Convert lightning address to LNURL format
    // Lightning addresses are in the format username@domain.com
    const [username, domain] = lightningAddress.split('@');
    
    if (!username || !domain) {
      return NextResponse.json(
        { error: 'Invalid lightning address format' },
        { status: 400 }
      );
    }

    // Step 1: Fetch LNURL-pay endpoint from well-known URL
    const wellKnownUrl = `https://${domain}/.well-known/lnurlp/${username}`;
    
    const lnurlResponse = await fetch(wellKnownUrl);
    
    if (!lnurlResponse.ok) {
      console.error('Failed to fetch LNURL endpoint:', lnurlResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch payment information from lightning address' },
        { status: 500 }
      );
    }

    const lnurlData = await lnurlResponse.json();

    // Validate LNURL response
    if (lnurlData.status === 'ERROR') {
      return NextResponse.json(
        { error: lnurlData.reason || 'Lightning address returned an error' },
        { status: 400 }
      );
    }

    // Check if the amount is within the allowed range
    const minSendable = lnurlData.minSendable ? lnurlData.minSendable / 1000 : 1;
    const maxSendable = lnurlData.maxSendable ? lnurlData.maxSendable / 1000 : 1000000000;

    if (amountSats < minSendable || amountSats > maxSendable) {
      return NextResponse.json(
        { 
          error: `Amount must be between ${minSendable} and ${maxSendable} sats`,
          minSendable,
          maxSendable
        },
        { status: 400 }
      );
    }

    // Step 2: Request invoice from the callback URL
    const callbackUrl = new URL(lnurlData.callback);
    callbackUrl.searchParams.set('amount', (amountSats * 1000).toString()); // Convert to millisats

    const invoiceResponse = await fetch(callbackUrl.toString());
    
    if (!invoiceResponse.ok) {
      console.error('Failed to fetch invoice:', invoiceResponse.status);
      return NextResponse.json(
        { error: 'Failed to generate invoice' },
        { status: 500 }
      );
    }

    const invoiceData = await invoiceResponse.json();

    if (invoiceData.status === 'ERROR') {
      return NextResponse.json(
        { error: invoiceData.reason || 'Failed to generate invoice' },
        { status: 400 }
      );
    }

    if (!invoiceData.pr) {
      return NextResponse.json(
        { error: 'No invoice received from lightning address' },
        { status: 500 }
      );
    }

    // Return the invoice and additional metadata
    return NextResponse.json({
      invoice: invoiceData.pr,
      amountSats,
      recipientAddress: lightningAddress,
      description: lnurlData.metadata ? parseMetadata(lnurlData.metadata) : null,
      successAction: invoiceData.successAction || null,
    });

  } catch (error) {
    console.error('Lightning invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing lightning payment' },
      { status: 500 }
    );
  }
}

// Helper function to parse LNURL metadata
function parseMetadata(metadata: string | any[][]): string | null {
  try {
    let metadataArray = metadata;
    
    // If metadata is a string, parse it as JSON
    if (typeof metadata === 'string') {
      metadataArray = JSON.parse(metadata);
    }

    // Find the plain text description in the metadata
    if (Array.isArray(metadataArray)) {
      const textEntry = metadataArray.find(entry => entry[0] === 'text/plain');
      if (textEntry && textEntry[1]) {
        return textEntry[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return null;
  }
}