'use client';

import { apiClient } from '@/lib/api/client';
import { breezSDK } from '@/lib/services/breez-sdk';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { LightningAddressInfo } from '@breeztech/breez-sdk-spark/web';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

const CACHED_LN_ADDRESS_KEY = 'evento_ln_address_synced';

export function useLightningAddress() {
  const { walletState } = useWallet();
  const lightningAddress = useWalletStore((state) => state.lightningAddress);
  const setLightningAddress = useWalletStore((state) => state.setLightningAddress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync address to backend (for ticketing payments)
  const syncAddressToBackend = useCallback(async (address: string) => {
    // Check localStorage cache to avoid redundant API calls
    if (typeof window === 'undefined') return;

    const cachedAddress = localStorage.getItem(CACHED_LN_ADDRESS_KEY);

    if (cachedAddress === address) {
      // Already synced, skip API call
      return;
    }

    try {
      await apiClient.patch('/v1/user/lightning-address', {
        lightning_address: address,
      });

      // Cache the synced address
      localStorage.setItem(CACHED_LN_ADDRESS_KEY, address);
    } catch (error) {
      console.error('Failed to sync Lightning address to backend:', error);
      // Don't throw - this is a background sync, shouldn't break the flow
    }
  }, []);

  // Load Lightning address info on mount
  useEffect(() => {
    if (walletState.isConnected && !lightningAddress) {
      loadLightningAddress();
    }
  }, [walletState.isConnected, lightningAddress]);

  const loadLightningAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const addressInfo = await breezSDK.getLightningAddress();
      setLightningAddress(addressInfo);

      // Sync to backend (only if different from cached)
      if (addressInfo?.address) {
        await syncAddressToBackend(addressInfo.address);
      }
    } catch (error: any) {
      console.error('Failed to load Lightning address:', error);
      setError(error.message || 'Failed to load Lightning address');
    } finally {
      setIsLoading(false);
    }
  }, [setLightningAddress, syncAddressToBackend]);

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

        // Sync to backend
        if (addressInfo?.address) {
          await syncAddressToBackend(addressInfo.address);
        }

        return addressInfo;
      } catch (error: any) {
        console.error('Failed to register address:', error);
        setError(error.message || 'Failed to register Lightning address');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setLightningAddress, syncAddressToBackend]
  );

  const deleteAddress = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await breezSDK.deleteLightningAddress();
      setLightningAddress(null);

      // Clear the cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHED_LN_ADDRESS_KEY);
      }
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
