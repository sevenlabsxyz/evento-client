'use client';

import { Env } from '@/lib/constants/env';
import { useMutation } from '@tanstack/react-query';

interface AppleWalletPassOptions {
  ticketId: string;
  eventTitle: string;
}

interface AppleWalletError {
  message: string;
  status?: number;
}

/**
 * Hook to generate and download an Apple Wallet pass for a ticket
 */
export function useAddToAppleWallet() {
  return useMutation<void, AppleWalletError, AppleWalletPassOptions>({
    mutationFn: async ({ ticketId, eventTitle }) => {
      const response = await fetch(`${Env.NEXT_PUBLIC_API_URL}/v1/tickets/${ticketId}/apple-wallet`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate Apple Wallet pass';

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response wasn't JSON, use default message
        }

        throw {
          message: errorMessage,
          status: response.status,
        };
      }

      // Get the .pkpass blob from the response
      const blob = await response.blob();

      // Generate a sanitized filename
      const sanitizedTitle = eventTitle
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 50);
      const filename = `${sanitizedTitle}-ticket.pkpass`;

      // Trigger download
      downloadBlob(blob, filename);
    },
  });
}

/**
 * Helper function to trigger a blob download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup the object URL
  URL.revokeObjectURL(url);
}

/**
 * Detect if the current device supports Apple Wallet
 * Returns true for iOS and macOS devices
 */
export function isAppleWalletSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Check for iOS (iPhone, iPad, iPod)
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  // Check for macOS
  const isMacOS = /macintosh|mac os x/.test(userAgent) && !('ontouchend' in document);

  return isIOS || isMacOS;
}
