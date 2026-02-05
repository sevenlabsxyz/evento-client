'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { useEffect, useState } from 'react';

interface UseWaitForPaymentResult {
  /**
   * Whether the payment has been completed
   */
  isPaid: boolean;

  /**
   * The payment details (available when isPaid is true)
   */
  payment: Payment | null;

  /**
   * Error message if waiting failed
   */
  error: string | null;

  /**
   * Whether we're currently waiting for payment
   */
  isWaiting: boolean;
}

/**
 * Hook to wait for a specific invoice/payment to be completed
 * Useful for showing success screens after creating an invoice
 *
 * @param paymentRequest - BOLT11 invoice string to wait for (or null if no invoice yet)
 * @returns Payment status and details
 *
 * @example
 * ```tsx
 * const [invoice, setInvoice] = useState<string | null>(null);
 * const { isPaid, payment } = useWaitForPayment(invoice);
 *
 * useEffect(() => {
 *   if (isPaid && payment) {
 *     // Show success screen!
 *     console.log('Payment received!', payment);
 *   }
 * }, [isPaid, payment]);
 * ```
 */
export function useWaitForPayment(paymentRequest: string | null): UseWaitForPaymentResult {
  const [isPaid, setIsPaid] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    // Reset state when payment request changes
    setIsPaid(false);
    setPayment(null);
    setError(null);
    setIsWaiting(false);

    // If no payment request, nothing to wait for
    if (!paymentRequest) {
      return;
    }

    let isCancelled = false;
    setIsWaiting(true);

    const waitForPayment = async () => {
      try {
        const completedPayment = await breezSDK.waitForPayment(paymentRequest);

        // Check if component unmounted while waiting
        if (isCancelled) return;

        setPayment(completedPayment);
        setIsPaid(true);
        setError(null);
      } catch (err: any) {
        // Check if component unmounted while waiting
        if (isCancelled) return;

        setError(err.message || 'Failed to wait for payment');
        setIsPaid(false);
      } finally {
        if (!isCancelled) {
          setIsWaiting(false);
        }
      }
    };

    waitForPayment();

    // Cleanup function to cancel waiting if component unmounts
    return () => {
      isCancelled = true;
    };
  }, [paymentRequest]);

  return {
    isPaid,
    payment,
    error,
    isWaiting,
  };
}
