import { BreezSdk, Config, ConnectRequest, Network, Seed } from '@breeztech/breez-sdk-spark/web';
import { Env } from '@/lib/constants/env';
import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { toast } from '@/lib/utils/toast';

// Set to true to enable verbose logging
const DEBUG_BREEZ = false;

let sdkInstance: BreezSdk | null = null;
let isInitializing = false;
let initializationError: Error | null = null;
let sdkModule: any = null;
let currentWalletFingerprint: string | null = null;

/**
 * Create a wallet fingerprint from seed bytes for logging/debugging
 */
function getWalletFingerprintFromBytes(seed: Uint8Array): string {
  // Return first 8 bytes as hex for identification
  return Array.from(seed.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a wallet fingerprint from mnemonic for logging/debugging
 */
function getWalletFingerprint(mnemonic: string): string {
  const words = mnemonic.trim().split(/\s+/);
  return words.slice(0, 3).join(' ');
}

export class BreezSDKService {
  private static instance: BreezSDKService;
  private sdk: BreezSdk | null = null;
  private eventListenerId: string | null = null;
  private eventCallbacks: Set<(event: any) => void> = new Set();

  private constructor() {}

  static getInstance(): BreezSDKService {
    if (!BreezSDKService.instance) {
      BreezSDKService.instance = new BreezSDKService();
    }
    return BreezSDKService.instance;
  }

  /**
   * Initialize and connect to the Breez SDK with mnemonic
   */
  async connect(mnemonic: string, apiKey: string, network: Network = 'mainnet'): Promise<BreezSdk> {
    const newFingerprint = getWalletFingerprint(mnemonic);

    if (DEBUG_BREEZ) {
      console.debug('[BREEZ:CONNECT] Attempting to connect wallet');
      console.debug('[BREEZ:CONNECT] New wallet fingerprint:', newFingerprint);
      console.debug('[BREEZ:CONNECT] Current wallet fingerprint:', currentWalletFingerprint || 'none');
      console.debug('[BREEZ:CONNECT] SDK instance exists:', sdkInstance !== null);
    }

    if (sdkInstance) {
      if (currentWalletFingerprint === newFingerprint) {
        if (DEBUG_BREEZ) {
          console.debug('[BREEZ:CONNECT] Same wallet, returning existing SDK instance');
        }
        return sdkInstance;
      } else {
        if (DEBUG_BREEZ) {
          console.warn('[BREEZ:CONNECT] Different wallet detected!');
        }
        try {
          if (DEBUG_BREEZ) console.info('[BREEZ:CONNECT] Disconnecting existing wallet...');
          await this.disconnect();
        } catch (error) {
          if (DEBUG_BREEZ) {
            console.warn('[BREEZ:CONNECT] Failed to disconnect existing wallet, continuing', error);
          }
        }
        currentWalletFingerprint = newFingerprint;
      }
    }

    if (isInitializing) {
      while (isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (sdkInstance) return sdkInstance;
    }

    try {
      isInitializing = true;
      initializationError = null;

      if (!sdkModule) {
        if (DEBUG_BREEZ) {
          console.debug('Loading Breez SDK module...');
        }
        sdkModule = await import('@breeztech/breez-sdk-spark/web');
        if (sdkModule.default && typeof sdkModule.default === 'function') {
          if (DEBUG_BREEZ) {
            console.debug('Initializing Breez SDK WASM...');
          }
          await sdkModule.default();
        }
      }

      if (!apiKey) {
        throw new Error('Breez API key is required.');
      }

      const seed: Seed = {
        type: 'mnemonic',
        mnemonic,
        passphrase: undefined,
      };

      let config: Config;
      try {
        config = sdkModule.defaultConfig(network);
      } catch (err) {
        console.error('Failed to get default config', err);
        throw new Error('Failed to initialize Breez SDK. The WASM module may not be loaded properly.');
      }

      config.apiKey = apiKey;
      config.lnurlDomain = 'evento.cash';
      config.supportLnurlVerify = true;
      config.maxDepositClaimFee = { type: 'rate', satPerVbyte: 10 };

      const storageDir = './.breez-data';

      const connectRequest: ConnectRequest = {
        config,
        seed,
        storageDir,
      };

      this.sdk = await sdkModule.connect(connectRequest);
      sdkInstance = this.sdk;
      currentWalletFingerprint = newFingerprint;

      await this.setupEventListener();

      if (DEBUG_BREEZ) {
        console.debug('[BREEZ:CONNECT] Breez SDK connected successfully');
      }
      return this.sdk!;
    } catch (error: any) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CONNECTING);
      initializationError = error;
      isInitializing = false;
      const userMessage = getBreezErrorMessage(error, 'connect to wallet');
      throw new Error(userMessage);
    } finally {
      isInitializing = false;
    }
  }

  /**
   * Initialize and connect to the Breez SDK with raw seed bytes
   * Used for passkey wallets
   */
  async connectWithBytes(seed: Uint8Array, apiKey: string, network: Network = 'mainnet'): Promise<BreezSdk> {
    const newFingerprint = getWalletFingerprintFromBytes(seed);

    if (DEBUG_BREEZ) {
      console.debug('[BREEZ:CONNECT_BYTES] Attempting to connect wallet');
      console.debug('[BREEZ:CONNECT_BYTES] Wallet fingerprint:', newFingerprint);
    }

    if (sdkInstance) {
      if (currentWalletFingerprint === newFingerprint) {
        if (DEBUG_BREEZ) {
          console.debug('[BREEZ:CONNECT_BYTES] Same wallet, returning existing SDK instance');
        }
        return sdkInstance;
      } else {
        try {
          await this.disconnect();
        } catch (error) {
          if (DEBUG_BREEZ) {
            console.warn('[BREEZ:CONNECT_BYTES] Failed to disconnect existing wallet', error);
          }
        }
        currentWalletFingerprint = newFingerprint;
      }
    }

    if (isInitializing) {
      while (isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (sdkInstance) return sdkInstance;
    }

    try {
      isInitializing = true;
      initializationError = null;

      if (!sdkModule) {
        sdkModule = await import('@breeztech/breez-sdk-spark/web');
        if (sdkModule.default && typeof sdkModule.default === 'function') {
          await sdkModule.default();
        }
      }

      if (!apiKey) {
        throw new Error('Breez API key is required.');
      }

      // Convert Uint8Array to the format Breez expects
      // The Seed type for bytes might be different - need to check Breez SDK types
      const seedObj: Seed = {
        type: 'mnemonic',
        mnemonic: bytesToMnemonic(seed), // Need to convert or use different seed type
        passphrase: undefined,
      };

      // NOTE: This is a placeholder - Breez SDK may have a different way to accept raw bytes
      // The actual implementation depends on the Breez SDK's Seed type supporting bytes directly

      let config: Config;
      config = sdkModule.defaultConfig(network);
      config.apiKey = apiKey;
      config.lnurlDomain = 'evento.cash';
      config.supportLnurlVerify = true;
      config.maxDepositClaimFee = { type: 'rate', satPerVbyte: 10 };

      const storageDir = './.breez-data';

      const connectRequest: ConnectRequest = {
        config,
        seed: seedObj,
        storageDir,
      };

      this.sdk = await sdkModule.connect(connectRequest);
      sdkInstance = this.sdk;
      currentWalletFingerprint = newFingerprint;

      await this.setupEventListener();

      if (DEBUG_BREEZ) {
        console.debug('[BREEZ:CONNECT_BYTES] Breez SDK connected successfully');
      }
      return this.sdk!;
    } catch (error: any) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CONNECTING);
      initializationError = error;
      isInitializing = false;
      const userMessage = getBreezErrorMessage(error, 'connect to wallet');
      throw new Error(userMessage);
    } finally {
      isInitializing = false;
    }
  }

  /**
   * Disconnect from the Breez SDK
   */
  async disconnect(): Promise<void> {
    if (this.sdk) {
      try {
        if (this.eventListenerId) {
          await this.sdk.removeEventListener(this.eventListenerId);
          this.eventListenerId = null;
        }
        await this.sdk.disconnect();
        this.sdk = null;
        sdkInstance = null;
        currentWalletFingerprint = null;
        this.eventCallbacks.clear();
      } catch (error) {
        logBreezError(error, BREEZ_ERROR_CONTEXT.DISCONNECTING);
        throw error;
      }
    }
  }

  getSDK(): BreezSdk | null {
    return this.sdk;
  }

  isConnected(): boolean {
    return this.sdk !== null;
  }

  async getBalance(): Promise<number> {
    if (!this.sdk) throw new Error('SDK not connected');
    try {
      const nodeInfo = await this.sdk.getInfo({ ensureSynced: true });
      return Number(nodeInfo.balanceSats);
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.FETCHING_BALANCE);
      throw error;
    }
  }

  private async setupEventListener(): Promise<void> {
    if (!this.sdk) return;
    try {
      const eventListener = {
        onEvent: async (event: any) => {
          this.eventCallbacks.forEach((callback) => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in event callback', error);
            }
          });
        },
      };
      this.eventListenerId = await this.sdk.addEventListener(eventListener);
    } catch (error) {
      console.error('Failed to set up event listener', error);
    }
  }

  onEvent(callback: (event: any) => void): () => void {
    this.eventCallbacks.add(callback);
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }
}

// Helper function to convert bytes to mnemonic (BIP39)
function bytesToMnemonic(bytes: Uint8Array): string {
  // This requires the bip39 library - we need to generate mnemonic from entropy
  // For now, this is a placeholder - the actual Breez SDK may accept raw bytes directly
  throw new Error('bytesToMnemonic not implemented - check Breez SDK for raw seed support');
}

export const breezSDK = BreezSDKService.getInstance();
