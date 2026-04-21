'use client';

import {
  authenticateWithPRF,
  checkPasskeyAvailable,
  checkPasskeyPRFSupport,
  createPasskey,
  generatePRFSalt,
  getPasskeyErrorMessage,
  isPasskeyError,
  type AuthenticateWithPRFOptions,
  type CreatePasskeyOptions,
  type PasskeyCredential,
  type PasskeyError,
  type PRFAuthenticationResult,
  type PRFSupportResult,
} from '@/lib/services/passkey-service';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

// Debug flag for verbose logging
const DEBUG_PASSKEY = false;

// Query keys for passkey operations
const PASSKEY_QUERY_KEYS = {
  prfSupport: ['passkey', 'prfSupport'] as const,
  availability: ['passkey', 'availability'] as const,
};

/**
 * Hook for passkey operations with PRF support
 *
 * Provides methods to create passkeys, authenticate with PRF for wallet recovery,
 * and check browser capabilities.
 *
 * @example
 * ```typescript
 * const { createPasskey, authenticateWithPRF, checkPRFSupport, isLoading, error } = usePasskey();
 *
 * // Check PRF support
 * const isSupported = await checkPRFSupport();
 *
 * // Create a passkey
 * const credential = await createPasskey('evento.app');
 *
 * // Authenticate and derive wallet key
 * const result = await authenticateWithPRF('evento.app', 'unique-salt');
 * ```
 */
export function usePasskey() {
  const [lastError, setLastError] = useState<PasskeyError | null>(null);

  // Query to check PRF support
  const {
    data: prfSupport,
    isLoading: isCheckingPRFSupport,
    error: prfSupportError,
    refetch: refetchPRFSupport,
  } = useQuery({
    queryKey: PASSKEY_QUERY_KEYS.prfSupport,
    queryFn: checkPasskeyPRFSupport,
    staleTime: 5 * 60 * 1000, // 5 minutes - browser capabilities don't change often
    refetchOnWindowFocus: false,
  });

  // Query to check passkey availability
  const {
    data: availability,
    isLoading: isCheckingAvailability,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: PASSKEY_QUERY_KEYS.availability,
    queryFn: checkPasskeyAvailable,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Mutation for creating a passkey
  const createPasskeyMutation = useMutation({
    mutationFn: async ({
      rpId,
      options,
    }: {
      rpId: string;
      options?: CreatePasskeyOptions;
    }): Promise<PasskeyCredential> => {
      if (DEBUG_PASSKEY) {
        logger.debug('Creating passkey via hook', { rpId });
      }
      return createPasskey(rpId, options);
    },
    onError: (error: PasskeyError) => {
      if (DEBUG_PASSKEY) {
        logger.error('Passkey creation failed', {
          code: error.code,
          message: error.message,
        });
      }
      setLastError(error);
    },
    onSuccess: () => {
      setLastError(null);
    },
  });

  // Mutation for authenticating with PRF
  const authenticateMutation = useMutation({
    mutationFn: async ({
      rpId,
      salt,
      options,
    }: {
      rpId: string;
      salt: string | Uint8Array;
      options?: AuthenticateWithPRFOptions;
    }): Promise<PRFAuthenticationResult> => {
      if (DEBUG_PASSKEY) {
        logger.debug('Authenticating with PRF via hook', { rpId });
      }
      return authenticateWithPRF(rpId, salt, options);
    },
    onError: (error: PasskeyError) => {
      if (DEBUG_PASSKEY) {
        logger.error('PRF authentication failed', {
          code: error.code,
          message: error.message,
        });
      }
      setLastError(error);
    },
    onSuccess: () => {
      setLastError(null);
    },
  });

  /**
   * Create a new passkey credential
   *
   * @param rpId - Relying Party ID (typically the domain)
   * @param options - Additional options for credential creation
   * @returns Created passkey credential
   */
  const createPasskeyCallback = useCallback(
    async (rpId: string, options?: CreatePasskeyOptions): Promise<PasskeyCredential> => {
      return createPasskeyMutation.mutateAsync({ rpId, options });
    },
    [createPasskeyMutation]
  );

  /**
   * Authenticate with a passkey and evaluate PRF
   *
   * @param rpId - Relying Party ID (domain)
   * @param salt - Salt for PRF evaluation
   * @param options - Additional authentication options
   * @returns PRF output and credential info
   */
  const authenticateWithPRFCallback = useCallback(
    async (
      rpId: string,
      salt: string | Uint8Array,
      options?: AuthenticateWithPRFOptions
    ): Promise<PRFAuthenticationResult> => {
      return authenticateMutation.mutateAsync({ rpId, salt, options });
    },
    [authenticateMutation]
  );

  /**
   * Check if PRF is supported in the current browser
   *
   * @returns PRF support result
   */
  const checkPRFSupportCallback = useCallback(async (): Promise<PRFSupportResult> => {
    const result = await refetchPRFSupport();
    return result.data ?? { supported: false, reason: 'Unknown error' };
  }, [refetchPRFSupport]);

  /**
   * Generate a new salt for PRF evaluation
   *
   * @returns UUID v4 string suitable for use as a PRF salt
   */
  const generateSalt = useCallback((): string => {
    return generatePRFSalt();
  }, []);

  /**
   * Get a user-friendly error message
   *
   * @param error - PasskeyError to get message for
   * @returns User-friendly error message
   */
  const getErrorMessage = useCallback((error?: PasskeyError | Error | null): string => {
    if (!error) return '';
    if (isPasskeyError(error)) {
      return getPasskeyErrorMessage(error);
    }
    return error.message || 'An unexpected error occurred';
  }, []);

  // Combine loading states
  const isLoading =
    isCheckingPRFSupport ||
    isCheckingAvailability ||
    createPasskeyMutation.isPending ||
    authenticateMutation.isPending;

  // Combine errors (prioritize mutation errors, then query errors)
  const error =
    lastError ||
    (prfSupportError && isPasskeyError(prfSupportError) ? prfSupportError : null) ||
    (availabilityError && isPasskeyError(availabilityError) ? availabilityError : null) ||
    null;

  return {
    // Actions
    createPasskey: createPasskeyCallback,
    authenticateWithPRF: authenticateWithPRFCallback,
    checkPRFSupport: checkPRFSupportCallback,
    generateSalt,
    getErrorMessage,

    // State
    isLoading,
    error,

    // Detailed state
    isCreatingPasskey: createPasskeyMutation.isPending,
    isAuthenticating: authenticateMutation.isPending,
    isCheckingPRFSupport,
    isCheckingAvailability,

    // Data
    prfSupport,
    availability,

    // Mutation state for fine-grained control
    createPasskeyMutation,
    authenticateMutation,

    // Reset functions
    reset: useCallback(() => {
      createPasskeyMutation.reset();
      authenticateMutation.reset();
      setLastError(null);
    }, [createPasskeyMutation, authenticateMutation]),
    resetError: useCallback(() => {
      setLastError(null);
    }, []),
  };
}

/**
 * Hook for checking passkey and PRF support
 *
 * Lightweight hook that only checks browser capabilities without
 * providing passkey operations.
 *
 * @example
 * ```typescript
 * const { isSupported, isLoading, reason } = usePasskeySupport();
 * ```
 */
export function usePasskeySupport() {
  const { data, isLoading } = useQuery({
    queryKey: PASSKEY_QUERY_KEYS.prfSupport,
    queryFn: checkPasskeyPRFSupport,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    isSupported: data?.supported ?? false,
    isLoading,
    reason: data?.reason,
    fullResult: data,
  };
}

/**
 * Hook for passkey availability check
 *
 * Checks if passkeys are available and PRF is supported.
 *
 * @example
 * ```typescript
 * const { isAvailable, prfSupported, isLoading } = usePasskeyAvailability();
 * ```
 */
export function usePasskeyAvailability() {
  const { data, isLoading } = useQuery({
    queryKey: PASSKEY_QUERY_KEYS.availability,
    queryFn: checkPasskeyAvailable,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    isAvailable: data?.available ?? false,
    prfSupported: data?.prfSupported ?? false,
    isLoading,
    reason: data?.reason,
    fullResult: data,
  };
}
