'use client';

// Set to true to enable verbose wallet logging
const DEBUG_WALLET = false;

import { Env } from '@/lib/constants/env';
import { breezSDK } from '@/lib/services/breez-sdk';
import { BTCPriceService } from '@/lib/services/btc-price';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletSeedStore } from '@/lib/stores/wallet-seed-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { BTCPrice, WalletState } from '@/lib/types/wallet';
import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useState } from 'react';

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
              logBreezError(err, BREEZ_ERROR_CONTEXT.AUTO_CONNECTING_WALLET);
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
        logBreezError(err, BREEZ_ERROR_CONTEXT.INITIALIZING_WALLET);
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
        logBreezError(err, BREEZ_ERROR_CONTEXT.CREATING_WALLET);
        const userMessage = getBreezErrorMessage(err, 'create wallet');
        setError(userMessage);
        throw new Error(userMessage);
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
        logBreezError(err, BREEZ_ERROR_CONTEXT.RESTORING_WALLET);
        const userMessage = getBreezErrorMessage(err, 'restore wallet');
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed, clearSeed]
  );

  /**
   * Restore wallet from raw mnemonic (12/24 words)
   * Used when user imports a seed phrase directly
   */
  const restoreFromMnemonic = useCallback(
    async (mnemonic: string, pin: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Clear any existing wallet data first
        WalletStorageService.clearWalletData();
        clearSeed();

        // Connect to Breez SDK with the mnemonic
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Get balance to verify connection
        const balance = await breezSDK.getBalance();

        // Encrypt mnemonic with the new PIN
        const encryptedSeed = await WalletStorageService.encryptSeed(mnemonic, pin);
        WalletStorageService.saveEncryptedSeed(encryptedSeed);

        // Store seed in memory with TTL
        setInMemorySeed(mnemonic);

        // Update wallet state
        const newState: WalletState = {
          isInitialized: true,
          isConnected: true,
          balance,
          hasBackup: true, // User imported their own seed, so they have it
          lastBackupDate: new Date(),
        };

        setWalletState(newState);
        WalletStorageService.saveWalletState(newState);
      } catch (err: any) {
        logBreezError(err, BREEZ_ERROR_CONTEXT.RESTORING_FROM_MNEMONIC);
        const userMessage = getBreezErrorMessage(err, 'restore wallet');
        setError(userMessage);
        throw new Error(userMessage);
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
        logBreezError(err, BREEZ_ERROR_CONTEXT.UNLOCKING_WALLET);
        const userMessage = getBreezErrorMessage(err, 'unlock wallet');
        setError(userMessage);
        throw new Error(userMessage);
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
      logBreezError(err, BREEZ_ERROR_CONTEXT.LOCKING_WALLET);
      const userMessage = getBreezErrorMessage(err, 'lock wallet');
      setError(userMessage);
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
      logBreezError(err, BREEZ_ERROR_CONTEXT.REFRESHING_BALANCE);
      const userMessage = getBreezErrorMessage(err, 'refresh balance');
      setError(userMessage);
    }
  }, [setWalletState, setError]);

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

      // Clear transaction flag since wallet is now backed up
      WalletStorageService.clearTransactionFlag();

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
      logBreezError(err, 'getting encrypted backup');
      throw new Error('Invalid password');
    }
  }, []);

  return {
    walletState,
    isLoading,
    error,
    createWallet,
    restoreWallet,
    restoreFromMnemonic,
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.REFRESHING_BALANCE);
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
      logger.error('Failed to fetch BTC price', {
        error: error instanceof Error ? error.message : String(error),
      });
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
