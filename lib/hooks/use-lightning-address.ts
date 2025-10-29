'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import { LightningAddressInfo } from '@breeztech/breez-sdk-spark/web';
import { useCallback, useEffect, useState } from 'react';
import { useWallet } from './use-wallet';

interface LightningAddressState {
  address: LightningAddressInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useLightningAddress() {
  const { walletState } = useWallet();
  const [state, setState] = useState<LightningAddressState>({
    address: null,
    isLoading: false,
    error: null,
  });

  // Load Lightning address info on mount
  useEffect(() => {
    if (walletState.isConnected) {
      loadLightningAddress();
    }
  }, [walletState.isConnected]);

  const loadLightningAddress = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const addressInfo = await breezSDK.getLightningAddress();
      setState((prev) => ({ ...prev, address: addressInfo, isLoading: false }));
    } catch (error: any) {
      console.error('Failed to load Lightning address:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to load Lightning address',
        isLoading: false,
      }));
    }
  }, []);

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
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const addressInfo = await breezSDK.registerLightningAddress(username, description);
        setState((prev) => ({
          ...prev,
          address: addressInfo,
          isLoading: false,
        }));

        return addressInfo;
      } catch (error: any) {
        console.error('Failed to register address:', error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to register Lightning address',
          isLoading: false,
        }));
        throw error;
      }
    },
    []
  );

  const deleteAddress = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await breezSDK.deleteLightningAddress();
      setState((prev) => ({ ...prev, address: null, isLoading: false }));
    } catch (error: any) {
      console.error('Failed to delete address:', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to delete Lightning address',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    address: state.address,
    isLoading: state.isLoading,
    error: state.error,
    checkAvailability,
    registerAddress,
    deleteAddress,
    loadLightningAddress,
    clearError,
  };
}
