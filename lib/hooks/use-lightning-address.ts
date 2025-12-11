'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { LightningAddressInfo } from '@breeztech/breez-sdk-spark/web';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

export function useLightningAddress() {
  const { walletState } = useWallet();
  const lightningAddress = useWalletStore((state) => state.lightningAddress);
  const setLightningAddress = useWalletStore((state) => state.setLightningAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLightningAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const addressInfo = await breezSDK.getLightningAddress();
      setLightningAddress(addressInfo);
    } catch (error: any) {
      console.error('Failed to load Lightning address:', error);
      setError(error.message || 'Failed to load Lightning address');
    } finally {
      setIsLoading(false);
    }
  }, [setLightningAddress]);

  // Load Lightning address info on mount
  useEffect(() => {
    if (walletState.isConnected && !lightningAddress) {
      loadLightningAddress();
    }
  }, [walletState.isConnected, lightningAddress, loadLightningAddress]);

  const checkAvailability = useCallback(async (username: string): Promise<boolean> => {
    try {
      return await breezSDK.checkLightningAddressAvailable(username);
    } catch (error: any) {
      console.error('Failed to check availability:', error);
      throw error;
    }
  }, []);

  const registerAddress = useCallback(
    async (username: string, description?: string): Promise<LightningAddressInfo> => {
      try {
        setIsLoading(true);
        setError(null);

        const addressInfo = await breezSDK.registerLightningAddress(username, description);
        setLightningAddress(addressInfo);

        return addressInfo;
      } catch (error: any) {
        console.error('Failed to register address:', error);
        setError(error.message || 'Failed to register Lightning address');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setLightningAddress]
  );

  const deleteAddress = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await breezSDK.deleteLightningAddress();
      setLightningAddress(null);
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      setError(error.message || 'Failed to delete Lightning address');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setLightningAddress]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    address: lightningAddress,
    isLoading,
    error,
    checkAvailability,
    registerAddress,
    deleteAddress,
    loadLightningAddress,
    clearError,
  };
}
