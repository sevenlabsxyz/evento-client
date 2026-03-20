'use client';

import { useContacts } from '@/lib/hooks/use-contacts';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Extracts a suggested contact name from a Lightning address.
 * @param lightningAddress - Lightning address in format "user@domain"
 * @returns The username portion (before @) as the suggested name
 */
function extractSuggestedName(lightningAddress: string): string {
  const parts = lightningAddress.split('@');
  return parts[0] || lightningAddress;
}

/**
 * Hook that provides a function to show a "save contact" prompt after successful Lightning address payment.
 *
 * The prompt only appears for Lightning address payments (not BOLT11 invoices or Bitcoin on-chain),
 * and only if the address is not already in the user's contacts.
 *
 * @returns showSaveContactPrompt function
 *
 * @example
 * ```tsx
 * const { showSaveContactPrompt } = useSaveContactPrompt();
 *
 * // After successful Lightning address payment
 * if (parsedInput?.type === 'lightningAddress') {
 *   showSaveContactPrompt(invoice.trim(), () => {
 *     console.log('Contact saved!');
 *   });
 * }
 * ```
 */
export function useSaveContactPrompt() {
  const { findContactByAddress, addContactAsync } = useContacts();

  const showSaveContactPrompt = useCallback(
    async (lightningAddress: string, onSave?: () => void) => {
      // Check if address already exists in contacts
      const existingContact = findContactByAddress(lightningAddress);
      if (existingContact) {
        return; // Don't show prompt if contact already exists
      }

      // Extract suggested name from Lightning address (user@domain -> 'user')
      const suggestedName = extractSuggestedName(lightningAddress);

      // Show toast with Save and Skip actions
      toast(`Save ${suggestedName} as contact?`, {
        description: `Add ${lightningAddress} to your contacts for easy future payments.`,
        action: {
          label: 'Save',
          onClick: async () => {
            const savePromise = addContactAsync({
              name: suggestedName,
              paymentIdentifier: lightningAddress,
            });

            toast.promise(savePromise, {
              loading: 'Saving contact...',
              success: () => {
                onSave?.();
                return 'Contact saved';
              },
              error: () => {
                // Error is already handled by useContacts hook's toast
                return 'Failed to save contact';
              },
            });
          },
        },
        cancel: {
          label: 'Skip',
          onClick: () => {
            // Just dismiss - no action needed
          },
        },
        duration: 10000, // 10 seconds to give user time to decide
      });
    },
    [findContactByAddress, addContactAsync]
  );

  return { showSaveContactPrompt };
}

export { extractSuggestedName };
