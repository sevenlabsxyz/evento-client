'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import { passkeyService } from '@/lib/services/passkey-service';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { Env } from '@/lib/constants/env';
import { useWalletSeedStore } from '@/lib/stores/wallet-seed-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { WalletState } from '@/lib/types/wallet';
import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useState } from 'react';

// Wallet type - determines which auth method is used
type WalletType = 'mnemonic' | 'passkey' | null;

export function useWallet() {
  const { walletState, isLoading, error, setWalletState, setLoading, setError } = useWalletStore();
  const { getSeed: getInMemorySeed, isSeedValid, setSeed: setInMemorySeed, clearSeed } = useWalletSeedStore();
  const [walletType, setWalletType] = useState<WalletType>(null);

  // Load wallet type on mount
  useEffect(() => {
    const loadWalletType = () => {
      if (typeof window === 'undefined') return;
      const savedType = localStorage.getItem('evento_wallet_type') as WalletType;
      if (savedType === 'mnemonic' || savedType === 'passkey') {
        setWalletType(savedType);
      }
    };
    loadWalletType();
  }, []);

  // Save wallet type when it changes
  const saveWalletType = useCallback((type: WalletType) => {
    if (typeof window === 'undefined') return;
    if (type) {
      localStorage.setItem('evento_wallet_type', type);
    } else {
      localStorage.removeItem('evento_wallet_type');
    }
    setWalletType(type);
  }, []);

  // Initialize wallet on mount
  useEffect(() => {
    const initWallet = async () => {
      try {
        // Check if there's an encrypted seed (mnemonic wallet)
        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        const savedState = WalletStorageService.getWalletState();
        const savedType = localStorage.getItem('evento_wallet_type') as WalletType;

        if (savedType === 'passkey') {
          // Passkey wallet - check if we have a cached label
          const cachedLabel = localStorage.getItem('evento_passkey_label') || 'evento';
          // Passkey wallets are always "initialized" but need unlock via biometric
          setWalletState({
            isInitialized: true,
            isConnected: false,
            balance: 0,
            hasBackup: true, // Passkey wallets don't need traditional backup
          });
        } else if (encryptedSeed) {
          // Mnemonic wallet - existing flow
          const inMemorySeed = getInMemorySeed();
          if (inMemorySeed && isSeedValid()) {
            try {
              await breezSDK.connect(inMemorySeed, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');
              const balance = await breezSDK.getBalance();
              setWalletState({
                isInitialized: true,
                isConnected: true,
                balance,
                hasBackup: savedState?.hasBackup || false,
              });
            } catch (err) {
              setWalletState({
                isInitialized: true,
                isConnected: false,
                balance: 0,
                hasBackup: savedState?.hasBackup || false,
              });
            }
          } else {
            setWalletState({
              isInitialized: true,
              isConnected: false,
              balance: 0,
              hasBackup: savedState?.hasBackup || false,
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

  // ========== PASSKEY WALLET METHODS ==========

  /**
   * Create a new passkey wallet
   * This is separate from mnemonic wallet flow
   */
  const createPasskeyWallet = useCallback(
    async (label: string = 'evento'): Promise<{ mnemonic: string }> => {
      try {
        setLoading(true);
        setError(null);

        // Initialize passkey service
        await passkeyService.initialize();

        // Create wallet - this will trigger WebAuthn credential creation
        const { seed, mnemonic } = await passkeyService.createWallet(label);

        // Connect to Breez SDK with passkey-derived seed
        await breezSDK.connectWithBytes(seed, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Update state
        setWalletState({
          isInitialized: true,
          isConnected: true,
          balance: 0,
          hasBackup: false, // User hasn't seen recovery phrase yet
        });

        // Save wallet type
        saveWalletType('passkey');

        // Cache the label
        localStorage.setItem('evento_passkey_label', label);

        return { mnemonic };
      } catch (err: any) {
        logBreezError(err, 'creating passkey wallet');
        const userMessage = getBreezErrorMessage(err, 'create passkey wallet');
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setLoading(false);
      }
    },
    [saveWalletType]
  );

  /**
   * Unlock a passkey wallet
   * Triggers biometric prompt
   */
  const unlockPasskeyWallet = useCallback(
    async (label: string = 'evento'): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Initialize passkey service
        await passkeyService.initialize();

        // Connect to wallet - triggers biometric
        const { seed } = await passkeyService.connectWallet(label);

        // Connect to Breez SDK
        await breezSDK.connectWithBytes(seed, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');

        // Get balance
        const balance = await breezSDK.getBalance();

        // Update state
        setWalletState((prev) => ({
          ...prev,
          isConnected: true,
          balance,
        }));
      } catch (err: any) {
        logBreezError(err, 'unlocking passkey wallet');
        const userMessage = getBreezErrorMessage(err, 'unlock wallet');
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get recovery phrase for a passkey wallet
   * Shows the 12-word mnemonic for emergency backup
   */
  const getPasskeyRecoveryPhrase = useCallback(
    async (label: string = 'evento'): Promise<string> => {
      try {
        await passkeyService.initialize();
        return await passkeyService.getRecoveryPhrase(label);
      } catch (err: any) {
        logBreezError(err, 'getting passkey recovery phrase');
        const userMessage = getBreezErrorMessage(err, 'retrieve recovery phrase');
        throw new Error(userMessage);
      }
    },
    []
  );

  // ========== MNEMONIC WALLET METHODS (UNCHANGED) ==========

  const createWallet = useCallback(
    async (password: string): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        WalletStorageService.clearWalletData();
        clearSeed();
        const mnemonic = WalletStorageService.generateMnemonic();
        const encryptedSeed = await WalletStorageService.encryptSeed(mnemonic, password);
        WalletStorageService.saveEncryptedSeed(encryptedSeed);
        setInMemorySeed(mnemonic);
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');
        setWalletState({
          isInitialized: true,
          isConnected: true,
          balance: 0,
          hasBackup: false,
        });
        saveWalletType('mnemonic');
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
    [setInMemorySeed, clearSeed, saveWalletType]
  );

  const restoreWallet = useCallback(
    async (encryptedSeed: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        WalletStorageService.clearWalletData();
        clearSeed();
        let mnemonic: string;
        try {
          mnemonic = await WalletStorageService.decryptSeed(encryptedSeed, password);
        } catch {
          throw new Error('Invalid backup string or password');
        }
        WalletStorageService.saveEncryptedSeed(encryptedSeed);
        setInMemorySeed(mnemonic);
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');
        const balance = await breezSDK.getBalance();
        const newState: WalletState = {
          isInitialized: true,
          isConnected: true,
          balance,
          hasBackup: true,
          lastBackupDate: new Date(),
        };
        setWalletState(newState);
        WalletStorageService.saveWalletState(newState);
        saveWalletType('mnemonic');
      } catch (err: any) {
        logBreezError(err, BREEZ_ERROR_CONTEXT.RESTORING_WALLET);
        const userMessage = getBreezErrorMessage(err, 'restore wallet');
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed, clearSeed, saveWalletType]
  );

  const restoreFromMnemonic = useCallback(
    async (mnemonic: string, pin: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        WalletStorageService.clearWalletData();
        clearSeed();
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');
        const balance = await breezSDK.getBalance();
        const encryptedSeed = await WalletStorageService.encryptSeed(mnemonic, pin);
        WalletStorageService.saveEncryptedSeed(encryptedSeed);
        setInMemorySeed(mnemonic);
        const newState: WalletState = {
          isInitialized: true,
          isConnected: true,
          balance,
          hasBackup: true,
          lastBackupDate: new Date(),
        };
        setWalletState(newState);
        WalletStorageService.saveWalletState(newState);
        saveWalletType('mnemonic');
      } catch (err: any) {
        logBreezError(err, BREEZ_ERROR_CONTEXT.RESTORING_FROM_MNEMONIC);
        const userMessage = getBreezErrorMessage(err, 'restore wallet');
        setError(userMessage);
        throw new Error(userMessage);
      } finally {
        setLoading(false);
      }
    },
    [setInMemorySeed, clearSeed, saveWalletType]
  );

  const unlockWallet = useCallback(
    async (password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        if (!encryptedSeed) {
          throw new Error('No wallet found');
        }
        const mnemonic = await WalletStorageService.decryptSeed(encryptedSeed, password);
        setInMemorySeed(mnemonic);
        await breezSDK.connect(mnemonic, Env.NEXT_PUBLIC_BREEZ_API_KEY, 'mainnet');
        const balance = await breezSDK.getBalance();
        const savedState = WalletStorageService.getWalletState();
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

  const lockWallet = useCallback(async (): Promise<void> => {
    try {
      await breezSDK.disconnect();
      clearSeed();
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

  const markAsBackedUp = useCallback(() => {
    setWalletState((prev) => {
      const newState = {
        ...prev,
        hasBackup: true,
        lastBackupDate: new Date(),
      };
      WalletStorageService.saveWalletState(newState);
      return newState;
    });
  }, []);

  const getEncryptedBackup = useCallback(
    async (password: string): Promise<string> => {
      try {
        const encryptedSeed = WalletStorageService.getEncryptedSeed();
        if (!encryptedSeed) {
          throw new Error('No wallet found');
        }
        await WalletStorageService.decryptSeed(encryptedSeed, password);
        return encryptedSeed;
      } catch (err: any) {
        logBreezError(err, 'getting encrypted backup');
        throw new Error('Invalid password');
      }
    },
    []
  );

  return {
    walletState,
    walletType,
    isLoading,
    error,
    // Passkey methods
    createPasskeyWallet,
    unlockPasskeyWallet,
    getPasskeyRecoveryPhrase,
    // Mnemonic methods (unchanged)
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
