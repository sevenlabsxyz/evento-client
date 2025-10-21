'use client';

import { Env } from '@/lib/constants/env';
import { breezSDK } from '@/lib/services/breez-sdk';
import { BTCPriceService } from '@/lib/services/btc-price';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletSeedStore } from '@/lib/stores/wallet-seed-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { BTCPrice, WalletState } from '@/lib/types/wallet';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '../utils/toast';

export function useWallet() {
  const { walletState, isLoading, error, setWalletState, setLoading, setError } = useWalletStore();

  const {
    getSeed: getInMemorySeed,
    isSeedValid,
    setSeed: setInMemorySeed,
    clearSeed,
  } = useWalletSeedStore();

  // Initialize wallet on mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        // Check if there's an encrypted seed (wallet exists)
        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        const savedState = WalletStorageService.getWalletState();

        // Handle inconsistent state: has state but no encrypted seed
        if (!encryptedSeed && savedState?.isInitialized) {
          console.warn('Inconsistent wallet state detected, clearing...');
          WalletStorageService.clearWalletData();
          setWalletState({
            isInitialized: false,
            isConnected: false,
            balance: 0,
            hasBackup: false,
          });
        } else if (encryptedSeed) {
          // Wallet exists, check if seed is in memory and valid
          const inMemorySeed = getInMemorySeed();

          if (inMemorySeed && isSeedValid()) {
            // Seed is still valid in memory, auto-connect
            try {
              await breezSDK.connect(inMemorySeed, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

              // Get current balance
              const balance = await breezSDK.getBalance();

              setWalletState({
                isInitialized: true,
                isConnected: true,
                balance,
                hasBackup: savedState?.hasBackup || false,
                lastBackupDate: savedState?.lastBackupDate,
                lightningAddress: savedState?.lightningAddress,
              });
            } catch (err) {
              console.error('Failed to connect wallet:', err);
              setWalletState({
                isInitialized: true,
                isConnected: false,
                balance: 0,
                hasBackup: savedState?.hasBackup || false,
                lastBackupDate: savedState?.lastBackupDate,
                lightningAddress: savedState?.lightningAddress,
              });
            }
          } else {
            // Seed expired or not in memory, show as initialized but locked
            setWalletState({
              isInitialized: true,
              isConnected: false,
              balance: 0,
              hasBackup: savedState?.hasBackup || false,
              lastBackupDate: savedState?.lastBackupDate,
              lightningAddress: savedState?.lightningAddress,
            });
          }
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };

    initWallet();
  }, [getInMemorySeed, isSeedValid]);

  // Save wallet state whenever it changes
  useEffect(() => {
    if (walletState.isInitialized) {
      WalletStorageService.saveWalletState(walletState);
    }
  }, [walletState]);

  /**
   * Create a new wallet
   */
  const createWallet = useCallback(
    async (password: string): Promise<string> => {
      try {
        setLoading(true);
        setError(null);

        // Clear any existing wallet data first
        WalletStorageService.clearWalletData();
        clearSeed();

        // Generate mnemonic
        const mnemonic = WalletStorageService.generateMnemonic();

        // Encrypt and save seed
        const encryptedSeed = await WalletStorageService.encryptSeed(mnemonic, password);
        WalletStorageService.saveEncryptedSeed(encryptedSeed);

        // Store seed in memory with TTL
        setInMemorySeed(mnemonic);

        // Connect to Breez SDK
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Update wallet state
        setWalletState({
          isInitialized: true,
          isConnected: true,
          balance: 0,
          hasBackup: false,
        });

        return mnemonic;
      } catch (err: any) {
        console.error('Failed to create wallet:', err);
        setError(err.message || 'Failed to create wallet');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed, clearSeed]
  );

  /**
   * Restore wallet from encrypted backup
   */
  const restoreWallet = useCallback(
    async (encryptedSeed: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Clear any existing wallet data first
        WalletStorageService.clearWalletData();
        clearSeed();

        let mnemonic: string;

        try {
          // Try to decrypt encrypted seed
          mnemonic = await WalletStorageService.decryptSeed(encryptedSeed, password);
        } catch {
          // Invalid seed
          throw new Error('Invalid backup string or password');
        }

        // Save encrypted seed
        WalletStorageService.saveEncryptedSeed(encryptedSeed);

        // Store seed in memory with TTL
        setInMemorySeed(mnemonic);

        // Connect to Breez SDK
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Get balance
        const balance = await breezSDK.getBalance();

        // Update wallet state
        const newState: WalletState = {
          isInitialized: true,
          isConnected: true,
          balance,
          hasBackup: true,
          lastBackupDate: new Date(),
        };

        setWalletState(newState);

        // Persist to localStorage
        WalletStorageService.saveWalletState(newState);
      } catch (err: any) {
        console.error('Failed to restore wallet:', err);
        setError(err.message || 'Failed to restore wallet');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed, clearSeed]
  );

  /**
   * Unlock wallet with password
   */
  const unlockWallet = useCallback(
    async (password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        if (!encryptedSeed) {
          throw new Error('No wallet found');
        }

        // Decrypt seed
        const mnemonic = await WalletStorageService.decryptSeed(encryptedSeed, password);

        // Store seed in memory with TTL
        setInMemorySeed(mnemonic);

        // Connect to Breez SDK
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Get balance
        const balance = await breezSDK.getBalance();

        // Get current saved state
        const savedState = WalletStorageService.getWalletState();

        // Update wallet state
        const newState = {
          isInitialized: true,
          isConnected: true,
          balance,
          hasBackup: savedState?.hasBackup || false,
          lastBackupDate: savedState?.lastBackupDate,
          lightningAddress: savedState?.lightningAddress,
        };

        setWalletState(newState);
      } catch (err: any) {
        console.error('Failed to unlock wallet:', err);
        setError(err.message || 'Invalid password');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed]
  );

  /**
   * Lock wallet
   */
  const lockWallet = useCallback(async (): Promise<void> => {
    try {
      await breezSDK.disconnect();
      clearSeed(); // Clear in-memory seed
      setWalletState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    } catch (err: any) {
      console.error('Failed to lock wallet:', err);
      setError(err.message || 'Failed to lock wallet');
    }
  }, [clearSeed]);

  /**
   * Refresh balance
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

  // Set up event listener for Breez SDK events
  useEffect(() => {
    if (!walletState.isConnected) return;

    console.log('Setting up Breez SDK event listener...');
    const unsubscribe = breezSDK.onEvent((event) => {
      console.log('Breez wallet event:', event);

      // Handle different event types
      if (event.type === 'paymentSucceeded') {
        const payment = (event as any).details;
        const isIncoming = payment?.paymentType === 'received';

        if (isIncoming) {
          // Show notification for incoming payment
          toast.success(`You received ${payment?.amountSats || 0} sats`);
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Payment Received', {
                body: `You received ${payment?.amountSats || 0} sats`,
                icon: '/logo.png',
              });
            }
          }
        } else {
          toast.success(`You sent ${payment?.amountSats || 0} sats`);
        }

        refreshBalance();
      } else if (event.type === 'synced') {
        refreshBalance();
      }
    });

    return () => {
      console.log('Cleaning up Breez SDK event listener');
      unsubscribe();
    };
  }, [walletState.isConnected, refreshBalance]);

  /**
   * Mark wallet as backed up
   */
  const markAsBackedUp = useCallback(() => {
    setWalletState((prev) => {
      const newState = {
        ...prev,
        hasBackup: true,
        lastBackupDate: new Date(),
      };

      // Persist to localStorage
      WalletStorageService.saveWalletState(newState);

      return newState;
    });
  }, []);

  /**
   * Get encrypted backup (requires password confirmation)
   */
  const getEncryptedBackup = useCallback(async (password: string): Promise<string> => {
    try {
      const encryptedSeed = WalletStorageService.getEncryptedSeed();
      if (!encryptedSeed) {
        throw new Error('No wallet found');
      }

      // Verify password by attempting to decrypt
      await WalletStorageService.decryptSeed(encryptedSeed, password);

      // Return the encrypted seed for backup
      return encryptedSeed;
    } catch (err: any) {
      console.error('Failed to get encrypted backup:', err);
      throw new Error('Invalid password');
    }
  }, []);

  return {
    walletState,
    isLoading,
    error,
    createWallet,
    restoreWallet,
    unlockWallet,
    lockWallet,
    refreshBalance,
    markAsBackedUp,
    getEncryptedBackup,
  };
}

export function useWalletBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [isLoading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    try {
      setLoading(true);

      if (!breezSDK.isConnected()) {
        return;
      }

      const sats = await breezSDK.getBalance();
      const usd = await BTCPriceService.satsToUSD(sats);

      setBalance(sats);
      setBalanceUSD(usd);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  return {
    balance,
    balanceUSD,
    isLoading,
    refreshBalance,
  };
}

export function useBTCPrice() {
  const [price, setPrice] = useState<BTCPrice | null>(null);
  const [isLoading, setLoading] = useState(true);

  const refreshPrice = useCallback(async () => {
    try {
      setLoading(true);
      const btcPrice = await BTCPriceService.fetchPrice();
      setPrice(btcPrice);
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPrice();

    // Refresh price every 5 minutes
    const interval = setInterval(refreshPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshPrice]);

  return {
    price,
    isLoading,
    refreshPrice,
  };
}
