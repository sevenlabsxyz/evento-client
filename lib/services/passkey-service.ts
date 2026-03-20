import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { breezSDK } from '@/lib/services/breez-sdk';
import { Env } from '@/lib/constants/env';
import {
  Passkey,
  type NostrRelayConfig,
  type PasskeyPrfProvider,
} from '@breeztech/breez-sdk-spark/web';
import { logger } from '@/lib/utils/logger';

const DEBUG_PASSKEY = false;

/**
 * WebAuthn PRF provider implementation for Breez SDK Passkey
 * Handles the WebAuthn API integration for passkey-based wallet derivation
 */
class WebPasskeyPrfProvider implements PasskeyPrfProvider {
  private readonly rpId = 'keys.breez.technology';

  /**
   * Derive PRF seed from passkey using WebAuthn PRF extension
   * @param salt - The salt string provided by Breez SDK (base64 encoded)
   * @returns 32-byte PRF output as Uint8Array
   */
  async derivePrfSeed(salt: string): Promise<Uint8Array> {
    if (DEBUG_PASSKEY) {
      console.debug('[Passkey] Deriving PRF seed...');
    }

    try {
      // Decode salt from base64
      const saltBytes = base64ToBytes(salt);

      if (DEBUG_PASSKEY) {
        console.debug('[Passkey] Salt bytes length:', saltBytes.length);
      }

      // WebAuthn options for PRF derivation
      const options: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: this.rpId,
        allowCredentials: [], // Empty for discoverable credentials
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: saltBytes,
            },
          },
        } as any, // PRF extension not yet in standard types
      };

      // Perform WebAuthn assertion
      const assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Passkey authentication cancelled or failed');
      }

      // Extract PRF results from client extension results
      const clientExtResults = assertion.getClientExtensionResults() as {
        prf?: {
          results?: {
            first?: ArrayBuffer;
          };
        };
      };

      if (!clientExtResults.prf?.results?.first) {
        throw new Error(
          'PRF extension not available or returned no results. ' +
            'Ensure your device supports the WebAuthn PRF extension.'
        );
      }

      const prfResult = new Uint8Array(clientExtResults.prf.results.first);

      if (prfResult.length !== 32) {
        throw new Error(
          `Invalid PRF result length: expected 32 bytes, got ${prfResult.length}`
        );
      }

      if (DEBUG_PASSKEY) {
        console.debug('[Passkey] PRF seed derived successfully');
      }

      return prfResult;
    } catch (error) {
      if (DEBUG_PASSKEY) {
        console.error('[Passkey] PRF derivation failed:', error);
      }
      throw error;
    }
  }

  /**
   * Check if PRF-capable passkey is available
   * @returns true if user has a PRF-capable passkey registered
   */
  async isPrfAvailable(): Promise<boolean> {
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Check if user has a passkey registered for this RP
      // We do a "dry run" assertion with an empty allowCredentials
      // If the user has a discoverable credential, the browser will prompt
      // If not, it will fail immediately
      const options: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: this.rpId,
        allowCredentials: [],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: new Uint8Array(32), // Dummy salt for availability check
            },
          },
        } as any,
      };

      // Try to get credentials - this will fail if no passkey exists
      // We use a timeout to avoid hanging
      const assertionPromise = navigator.credentials.get({
        publicKey: options,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      await assertionPromise;
      return true;
    } catch (error) {
      // Expected error if no passkey exists
      return false;
    }
  }
}

/**
 * Service for managing passkey-based Bitcoin wallets
 * Provides high-level methods for creating, connecting, and managing passkey wallets
 */
export class PasskeyService {
  private static instance: PasskeyService;
  private passkey: Passkey | null = null;
  private prfProvider: WebPasskeyPrfProvider;
  private initialized = false;

  private constructor() {
    this.prfProvider = new WebPasskeyPrfProvider();
  }

  static getInstance(): PasskeyService {
    if (!PasskeyService.instance) {
      PasskeyService.instance = new PasskeyService();
    }
    return PasskeyService.instance;
  }

  /**
   * Initialize the passkey service with Nostr relay configuration
   * Must be called before using other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const relayConfig: NostrRelayConfig = {
        breezApiKey: Env.NEXT_PUBLIC_BREEZ_API_KEY,
        timeoutSecs: 30,
      };

      this.passkey = new Passkey(this.prfProvider, relayConfig);
      this.initialized = true;

      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Initialized');
      }
    } catch (error) {
      logBreezError(error, 'initializing passkey service');
      throw new Error('Failed to initialize passkey service');
    }
  }

  /**
   * Check if passkey is available on this device/browser
   * @returns true if WebAuthn PRF is supported and passkey exists
   */
  async isPasskeyAvailable(): Promise<boolean> {
    try {
      // First check WebAuthn support
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Check PRF extension support
      const isUVPAA = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isUVPAA) {
        return false;
      }

      // Check if user has a passkey registered
      return await this.prfProvider.isPrfAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Check if WebAuthn PRF is supported (but passkey may not exist yet)
   * Use this for "can create passkey" checks
   */
  async isPasskeySupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Check if platform authenticator is available
      const isUVPAA = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isUVPAA) {
        return false;
      }

      // Note: We can't easily check PRF extension support without actually trying
      // The browser may support WebAuthn but not PRF
      // For now, we assume Chrome 110+, Safari 16+, Edge 110+ support PRF
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
      const isEdge = /edg/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

      // Chrome 110+, Edge 110+, Safari 16+ support PRF
      if (isChrome) {
        const chromeVersion = parseInt(
          userAgent.match(/chrome\/(\d+)/)?.[1] || '0'
        );
        return chromeVersion >= 110;
      }

      if (isEdge) {
        const edgeVersion = parseInt(
          userAgent.match(/edg\/(\d+)/)?.[1] || '0'
        );
        return edgeVersion >= 110;
      }

      if (isSafari) {
        // Safari 16+ - version detection is tricky in Safari
        // For now, assume recent Safari supports it
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Create a new passkey wallet
   * @param label - Wallet label (defaults to "evento")
   * @returns Object with seed (for Breez SDK) and mnemonic (for emergency backup)
   */
  async createWallet(
    label: string = 'evento'
  ): Promise<{
    seed: Uint8Array;
    mnemonic: string;
  }> {
    if (!this.passkey) {
      throw new Error('Passkey service not initialized');
    }

    try {
      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Creating wallet with label:', label);
      }

      // First, create the WebAuthn credential with PRF extension
      await this.registerPasskeyCredential();

      // Derive wallet from passkey
      const wallet = await this.passkey.getWallet(label);

      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Wallet created successfully');
      }

      // Store label on Nostr for cross-device discovery
      try {
        await this.passkey.storeLabel(label);
        if (DEBUG_PASSKEY) {
          console.debug('[PasskeyService] Label stored on Nostr');
        }
      } catch (nostrError) {
        // Non-critical: Nostr is best-effort
        logger.warn('Failed to store label on Nostr (non-critical)', {
          error:
            nostrError instanceof Error
              ? nostrError.message
              : String(nostrError),
        });
      }

      return {
        seed: wallet.seed,
        mnemonic: wallet.mnemonic,
      };
    } catch (error) {
      logBreezError(error, 'creating passkey wallet');
      const userMessage = getBreezErrorMessage(
        error,
        'create passkey wallet'
      );
      throw new Error(userMessage);
    }
  }

  /**
   * Connect to an existing passkey wallet
   * @param label - Wallet label (defaults to "evento")
   * @returns Object with seed (for Breez SDK) and mnemonic
   */
  async connectWallet(
    label: string = 'evento'
  ): Promise<{
    seed: Uint8Array;
    mnemonic: string;
  }> {
    if (!this.passkey) {
      throw new Error('Passkey service not initialized');
    }

    try {
      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Connecting wallet with label:', label);
      }

      const wallet = await this.passkey.getWallet(label);

      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Wallet connected successfully');
      }

      return {
        seed: wallet.seed,
        mnemonic: wallet.mnemonic,
      };
    } catch (error) {
      logBreezError(error, 'connecting passkey wallet');
      const userMessage = getBreezErrorMessage(
        error,
        'connect to passkey wallet'
      );
      throw new Error(userMessage);
    }
  }

  /**
   * List all wallet labels associated with this passkey
   * Uses Nostr to discover labels across devices
   * @returns Array of label strings
   */
  async listWallets(): Promise<string[]> {
    if (!this.passkey) {
      throw new Error('Passkey service not initialized');
    }

    try {
      const labels = await this.passkey.listLabels();
      return labels;
    } catch (error) {
      logBreezError(error, 'listing passkey wallets');
      // Return empty array on Nostr failure
      return [];
    }
  }

  /**
   * Get the recovery phrase for a passkey wallet
   * @param label - Wallet label
   * @returns 12-word mnemonic string
   */
  async getRecoveryPhrase(label: string = 'evento'): Promise<string> {
    if (!this.passkey) {
      throw new Error('Passkey service not initialized');
    }

    try {
      const wallet = await this.passkey.getWallet(label);
      return wallet.mnemonic;
    } catch (error) {
      logBreezError(error, 'getting recovery phrase');
      throw new Error('Failed to retrieve recovery phrase');
    }
  }

  /**
   * Register a new WebAuthn credential with PRF extension
   * This creates the passkey that will be used for wallet derivation
   */
  private async registerPasskeyCredential(): Promise<void> {
    if (DEBUG_PASSKEY) {
      console.debug('[PasskeyService] Registering new passkey credential...');
    }

    // Generate a user ID (anonymous, just for WebAuthn)
    const userId = crypto.getRandomValues(new Uint8Array(32));

    const options: PublicKeyCredentialCreationOptions = {
      rp: {
        name: 'Evento',
        id: this.rpId,
      },
      user: {
        id: userId,
        name: 'Evento Wallet',
        displayName: 'Evento Wallet',
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (Touch ID, Windows Hello)
        userVerification: 'required',
        residentKey: 'required', // Discoverable credential required
      },
      attestation: 'none',
      extensions: {
        prf: {
          eval: {
            first: new Uint8Array(32), // PRF extension with dummy salt for registration
          },
        },
      } as any,
    };

    try {
      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Passkey creation cancelled');
      }

      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Passkey credential registered');
      }
    } catch (error) {
      if (DEBUG_PASSKEY) {
        console.error('[PasskeyService] Passkey registration failed:', error);
      }
      throw error;
    }
  }
}

/**
 * Hook to check passkey capability
 * @returns Object with availability status and loading state
 */
export function usePasskeyCapability() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkCapabilities();
  }, []);

  async function checkCapabilities() {
    try {
      setIsLoading(true);
      const service = PasskeyService.getInstance();
      await service.initialize();

      const supported = await service.isPasskeySupported();
      setIsSupported(supported);

      // Only check availability if supported
      if (supported) {
        const available = await service.isPasskeyAvailable();
        setIsAvailable(available);
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      logger.error('Failed to check passkey capability', {
        error: error instanceof Error ? error.message : String(error),
      });
      setIsSupported(false);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }

  return { isAvailable, isSupported, isLoading, recheck: checkCapabilities };
}

/**
 * Utility to convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// React hook imports
import { useState, useEffect } from 'react';

// Export singleton instance
export const passkeyService = PasskeyService.getInstance();
