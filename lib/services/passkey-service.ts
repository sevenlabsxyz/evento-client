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
import { useState, useEffect } from 'react';

const DEBUG_PASSKEY = false;

/**
 * WebAuthn PRF provider implementation for Breez SDK Passkey
 */
class WebPasskeyPrfProvider implements PasskeyPrfProvider {
  private readonly rpId = 'keys.breez.technology';

  async derivePrfSeed(salt: string): Promise<Uint8Array> {
    if (DEBUG_PASSKEY) {
      console.debug('[Passkey] Deriving PRF seed...');
    }

    try {
      const saltBytes = base64ToBytes(salt);

      if (DEBUG_PASSKEY) {
        console.debug('[Passkey] Salt bytes length:', saltBytes.length);
      }

      const options: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: this.rpId,
        allowCredentials: [],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: saltBytes,
            },
          },
        } as any,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Passkey authentication cancelled or failed');
      }

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

  async isPrfAvailable(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      const options: PublicKeyCredentialRequestOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: this.rpId,
        allowCredentials: [],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: new Uint8Array(32),
            },
          },
        } as any,
      };

      const assertionPromise = navigator.credentials.get({
        publicKey: options,
        signal: AbortSignal.timeout(5000),
      });

      await assertionPromise;
      return true;
    } catch {
      return false;
    }
  }
}

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

  async isPasskeyAvailable(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      const isUVPAA = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isUVPAA) {
        return false;
      }

      return await this.prfProvider.isPrfAvailable();
    } catch {
      return false;
    }
  }

  async isPasskeySupported(): Promise<boolean> {
    try {
      if (!window.PublicKeyCredential) {
        return false;
      }

      const isUVPAA = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isUVPAA) {
        return false;
      }

      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
      const isEdge = /edg/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);

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
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

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

      await this.registerPasskeyCredential();
      const wallet = await this.passkey.getWallet(label);

      if (DEBUG_PASSKEY) {
        console.debug('[PasskeyService] Wallet created successfully');
      }

      try {
        await this.passkey.storeLabel(label);
        if (DEBUG_PASSKEY) {
          console.debug('[PasskeyService] Label stored on Nostr');
        }
      } catch (nostrError) {
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

  async listWallets(): Promise<string[]> {
    if (!this.passkey) {
      throw new Error('Passkey service not initialized');
    }

    try {
      const labels = await this.passkey.listLabels();
      return labels;
    } catch (error) {
      logBreezError(error, 'listing passkey wallets');
      return [];
    }
  }

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

  private async registerPasskeyCredential(): Promise<void> {
    if (DEBUG_PASSKEY) {
      console.debug('[PasskeyService] Registering new passkey credential...');
    }

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
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      attestation: 'none',
      extensions: {
        prf: {
          eval: {
            first: new Uint8Array(32),
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

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const passkeyService = PasskeyService.getInstance();
