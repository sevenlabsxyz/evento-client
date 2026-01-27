'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import { BTCPriceService } from '@/lib/services/btc-price';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { FeeEstimate, InvoiceData } from '@/lib/types/wallet';
import { Payment, PrepareSendPaymentResponse } from '@breeztech/breez-sdk-spark/web';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

export function useReceivePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCallback(
    async (amountSats: number, description: string): Promise<InvoiceData> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!breezSDK.isConnected()) {
          throw new Error('Wallet not connected');
        }

        const response = await breezSDK.createInvoice(amountSats, description);

        const invoice: InvoiceData = {
          bolt11: response.paymentRequest,
          paymentRequest: response.paymentRequest,
          amount: amountSats,
          description,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
        };

        return invoice;
      } catch (err: any) {
        console.error('Failed to create invoice:', err);
        setError(err.message || 'Failed to create invoice');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createInvoice,
    isLoading,
    error,
  };
}

export function useSendPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);

  const prepareSend = useCallback(
    async (paymentRequest: string, amountSats?: number): Promise<PrepareSendPaymentResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!breezSDK.isConnected()) {
          throw new Error('Wallet not connected');
        }

        const response = await breezSDK.preparePayment(paymentRequest, amountSats);

        let fees: FeeEstimate = {
          lightning: 0,
        };

        // Extract fees based on payment method
        if (response.paymentMethod.type === 'bolt11Invoice') {
          fees.lightning = Number(response.paymentMethod.lightningFeeSats || 0);
          if (response.paymentMethod.sparkTransferFeeSats) {
            fees.sparkTransfer = Number(response.paymentMethod.sparkTransferFeeSats);
          }
        }

        setFeeEstimate(fees);
        return response;
      } catch (err: any) {
        console.error('Failed to prepare payment:', err);
        setError(err.message || 'Failed to prepare payment');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendPayment = useCallback(
    async (paymentRequest: string, amountSats?: number): Promise<any> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!breezSDK.isConnected()) {
          throw new Error('Wallet not connected');
        }

        const response = await breezSDK.sendPayment(paymentRequest, amountSats);
        return response;
      } catch (err: any) {
        console.error('Failed to send payment:', err);
        setError(err.message || 'Failed to send payment');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    prepareSend,
    sendPayment,
    feeEstimate,
    isLoading,
    error,
  };
}

/**
 * Hook for fetching and managing payment history
 *
 * BREAKING CHANGE (0.7.x):
 * - Payment.amount is now bigint (was amountSats: number)
 * - Payment.timestamp replaces paymentTime
 * - Payment.paymentType is now 'receive'/'send' (was 'received'/'sent')
 */
export function usePaymentHistory() {
  const { walletState } = useWallet();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start as true to show skeleton on initial load
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!breezSDK.isConnected()) {
        setPayments([]);
        setIsLoading(false);
        return;
      }

      const paymentList = await breezSDK.listPayments();
      // Sort by payment time, newest first
      // BREAKING CHANGE: timestamp replaces paymentTime
      const sortedPayments = paymentList.sort((a: Payment, b: Payment) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });
      setPayments(sortedPayments);

      // If wallet has transactions, mark it
      if (sortedPayments.length > 0) {
        WalletStorageService.markHasTransaction();
      }
    } catch (err: any) {
      console.error('Failed to fetch payments:', err);
      setError(err.message || 'Failed to fetch payment history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (walletState.isConnected) {
      fetchPayments();
    } else {
      // Wallet not connected, stop loading
      setIsLoading(false);
    }
  }, [walletState.isConnected, fetchPayments]);

  // Listen to payment events and auto-refresh
  useEffect(() => {
    if (!walletState.isConnected) return;

    const unsubscribe = breezSDK.onEvent((event) => {
      if (event.type === 'paymentSucceeded') {
        // Logging is now handled in breez-sdk.ts service layer
        fetchPayments();
      }
    });

    return () => unsubscribe();
  }, [walletState.isConnected, fetchPayments]);

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
  };
}

export function useZap() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendZap = useCallback(
    async (
      recipientLightningAddress: string,
      amountSats: number,
      message?: string
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!breezSDK.isConnected()) {
          throw new Error('Wallet not connected');
        }

        // For Lightning addresses, we need to fetch the invoice first
        // This is a simplified version - in production, implement LNURL-pay protocol
        const description = message || 'Zap from Evento';

        // Send the payment
        await breezSDK.sendPayment(recipientLightningAddress, amountSats);
      } catch (err: any) {
        console.error('Failed to send zap:', err);
        setError(err.message || 'Failed to send zap');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    sendZap,
    isLoading,
    error,
  };
}

export function useAmountConverter() {
  const [isConverting, setIsConverting] = useState(false);

  const satsToUSD = useCallback(async (sats: number): Promise<number> => {
    try {
      setIsConverting(true);
      return await BTCPriceService.satsToUSD(sats);
    } catch (error) {
      console.error('Failed to convert sats to USD:', error);
      return 0;
    } finally {
      setIsConverting(false);
    }
  }, []);

  const usdToSats = useCallback(async (usd: number): Promise<number> => {
    try {
      setIsConverting(true);
      return await BTCPriceService.usdToSats(usd);
    } catch (error) {
      console.error('Failed to convert USD to sats:', error);
      return 0;
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    satsToUSD,
    usdToSats,
    isConverting,
  };
}
