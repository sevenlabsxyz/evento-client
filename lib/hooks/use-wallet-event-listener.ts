'use client';

// Set to true to enable verbose wallet event logging
const DEBUG_WALLET = false;

import { breezSDK } from '@/lib/services/breez-sdk';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Global wallet event listener hook
 * Should only be called ONCE in the app (typically in layout)
 * Handles Breez SDK events and updates wallet state accordingly
 */
export function useWalletEventListener() {
  // Use Zustand selector for stable primitive value
  const isConnected = useWalletStore((state) => state.walletState.isConnected);
  const setWalletState = useWalletStore((state) => state.setWalletState);
  const setError = useWalletStore((state) => state.setError);

  /**
   * Refresh wallet balance
   */
  const refreshBalance = useCallback(async (): Promise<void> => {
    try {
      if (!breezSDK.isConnected()) {
        throw new Error('Wallet not connected');
      }

      const balance = await breezSDK.getBalance();
      setWalletState((prev) => ({
        ...prev,
        balance,
      }));
    } catch (err: any) {
      console.error('Failed to refresh balance:', err);
      setError(err.message || 'Failed to refresh balance');
    }
  }, [setWalletState, setError]);

  // Use ref to prevent refreshBalance from causing re-subscriptions
  const refreshBalanceRef = useRef(refreshBalance);
  useEffect(() => {
    refreshBalanceRef.current = refreshBalance;
  }, [refreshBalance]);

  // Set up event listener for Breez SDK events
  useEffect(() => {
    if (!isConnected) return;

    if (DEBUG_WALLET) console.log('Setting up Breez SDK event listener...');
    const unsubscribe = breezSDK.onEvent((event) => {
      // Logging is handled in breez-sdk.ts service layer

      // Handle different event types
      if (event.type === 'paymentSucceeded') {
        const payment = (event as any).payment;
        const isIncoming = payment?.paymentType === 'receive';

        // Mark that wallet has had a transaction (for backup reminder)
        WalletStorageService.markHasTransaction();

        if (isIncoming) {
          // Show browser notification for incoming payment
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Payment Received', {
                body: `You received ${payment?.amountSats || 0} sats`,
                icon: '/logo.png',
              });
            }
          }
        }

        refreshBalanceRef.current();
      } else if (event.type === 'synced') {
        refreshBalanceRef.current();
      }
    });

    return () => {
      if (DEBUG_WALLET) console.log('Cleaning up Breez SDK event listener');
      unsubscribe();
    };
  }, [isConnected]); // Only depends on primitive isConnected value

  return null; // This hook doesn't return anything
}
