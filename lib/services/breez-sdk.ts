import {
  BreezSdk,
  CheckLightningAddressRequest,
  Config,
  ConnectRequest,
  EventListener,
  GetInfoResponse,
  InputType,
  LightningAddressInfo,
  LnurlPayRequest,
  LnurlPayResponse,
  Network,
  Payment,
  PrepareLnurlPayRequest,
  PrepareLnurlPayResponse,
  PrepareSendPaymentRequest,
  PrepareSendPaymentResponse,
  ReceivePaymentMethod,
  ReceivePaymentRequest,
  RegisterLightningAddressRequest,
  SdkEvent,
  Seed,
  SendPaymentResponse,
  WaitForPaymentRequest,
  WaitForPaymentResponse,
} from '@breeztech/breez-sdk-spark';

let sdkInstance: BreezSdk | null = null;
let isInitializing = false;
let initializationError: Error | null = null;
let sdkModule: any = null;
let currentWalletFingerprint: string | null = null;

/**
 * Create a wallet fingerprint from mnemonic for logging/debugging
 * Returns first 3 words to identify wallet without exposing full seed
 */
function getWalletFingerprint(mnemonic: string): string {
  const words = mnemonic.trim().split(/\s+/);
  return words.slice(0, 3).join(' ');
}

export class BreezSDKService {
  private static instance: BreezSDKService;
  private sdk: BreezSdk | null = null;
  private eventListenerId: string | null = null;
  private eventCallbacks: Set<(event: SdkEvent) => void> = new Set();

  private constructor() {}

  static getInstance(): BreezSDKService {
    if (!BreezSDKService.instance) {
      BreezSDKService.instance = new BreezSDKService();
    }

    return BreezSDKService.instance;
  }

  /**
   * Initialize and connect to the Breez SDK
   */
  async connect(mnemonic: string, apiKey: string, network: Network = 'mainnet'): Promise<BreezSdk> {
    const newFingerprint = getWalletFingerprint(mnemonic);

    console.log('🔑 [BREEZ:CONNECT] Attempting to connect wallet');
    console.log('  → New wallet fingerprint:', newFingerprint);
    console.log('  → Current wallet fingerprint:', currentWalletFingerprint || 'none');
    console.log('  → SDK instance exists:', sdkInstance !== null);

    if (sdkInstance) {
      if (currentWalletFingerprint === newFingerprint) {
        console.log('✅ [BREEZ:CONNECT] Same wallet, returning existing SDK instance');
        return sdkInstance;
      } else {
        console.warn('⚠️ [BREEZ:CONNECT] Different wallet detected!');
        console.warn('  → Current:', currentWalletFingerprint);
        console.warn('  → New:', newFingerprint);
        console.warn('  → Returning existing instance anyway (THIS IS THE BUG)');
        return sdkInstance;
      }
    }

    if (isInitializing) {
      // Wait for initialization to complete
      while (isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (sdkInstance) return sdkInstance;
    }

    try {
      isInitializing = true;
      initializationError = null;

      // Dynamically import the SDK module
      if (!sdkModule) {
        console.log('Loading Breez SDK module...');
        sdkModule = await import('@breeztech/breez-sdk-spark');

        // Initialize WASM if there's a default export (initialization function)
        if (sdkModule.default && typeof sdkModule.default === 'function') {
          console.log('Initializing Breez SDK WASM...');
          await sdkModule.default();
        }
      }

      // Check if API key is provided
      if (!apiKey) {
        throw new Error(
          'Breez API key is required. Please set NEXT_PUBLIC_BREEZ_API_KEY in your environment variables.'
        );
      }

      // Construct the seed
      const seed: Seed = {
        type: 'mnemonic',
        mnemonic,
        passphrase: undefined,
      };

      // Create the config
      let config: Config;
      try {
        config = sdkModule.defaultConfig(network);
      } catch (err) {
        console.error('Failed to get default config:', err);
        throw new Error(
          'Failed to initialize Breez SDK. The WASM module may not be loaded properly.'
        );
      }

      config.apiKey = apiKey;
      // Configure LNURL domain for Lightning addresses
      config.lnurlDomain = 'evento.cash';

      // Storage directory - using browser's IndexedDB
      const storageDir = './.breez-data';

      // Connect to SDK
      const connectRequest: ConnectRequest = {
        config,
        seed,
        storageDir,
      };

      this.sdk = await sdkModule.connect(connectRequest);
      sdkInstance = this.sdk;
      currentWalletFingerprint = newFingerprint;

      // Set up event listener
      await this.setupEventListener();

      console.log('✅ [BREEZ:CONNECT] Breez SDK connected successfully');
      console.log('  → Wallet fingerprint:', currentWalletFingerprint);
      return this.sdk!;
    } catch (error: any) {
      console.error('Failed to connect to Breez SDK:', error);
      initializationError = error;
      isInitializing = false;

      // Provide helpful error message
      if (error.message?.includes('defaultConfig')) {
        throw new Error(
          'Breez SDK initialization failed. Please refresh the page and try again. If the issue persists, check that the Breez SDK package is properly installed.'
        );
      }

      throw error;
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
        console.log('🔌 [BREEZ:DISCONNECT] Disconnecting wallet...');
        console.log('  → Current wallet fingerprint:', currentWalletFingerprint || 'unknown');

        // Remove event listener
        if (this.eventListenerId) {
          await this.sdk.removeEventListener(this.eventListenerId);
          this.eventListenerId = null;
        }

        await this.sdk.disconnect();
        this.sdk = null;
        sdkInstance = null;
        currentWalletFingerprint = null;
        this.eventCallbacks.clear();

        console.log('✅ [BREEZ:DISCONNECT] Breez SDK disconnected successfully');
        console.log('  → Wallet fingerprint cleared');
      } catch (error) {
        console.error('❌ [BREEZ:DISCONNECT] Failed to disconnect from Breez SDK:', error);
        throw error;
      }
    }
  }

  /**
   * Get the current SDK instance
   */
  getSDK(): BreezSdk | null {
    return this.sdk;
  }

  /**
   * Check if SDK is connected
   */
  isConnected(): boolean {
    return this.sdk !== null;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      console.log('💰 [BREEZ:GET_BALANCE] Fetching wallet balance...');
      console.log('  → Wallet fingerprint:', currentWalletFingerprint || 'unknown');

      const nodeInfo = await this.sdk.getInfo({ ensureSynced: true });

      console.log('💰 [BREEZ:GET_BALANCE] Balance fetched');
      console.log('  → Full nodeInfo:', nodeInfo);
      console.log('  → balanceSats:', nodeInfo.balanceSats);
      console.log('  → Wallet fingerprint:', currentWalletFingerprint || 'unknown');

      return Number(nodeInfo.balanceSats);
    } catch (error) {
      console.error('❌ [BREEZ:GET_BALANCE] Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Create a Lightning invoice to receive payment
   */
  async createInvoice(
    amountSats: number,
    description: string
  ): Promise<{ paymentRequest: string; feeSats: number }> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const request: ReceivePaymentRequest = {
        paymentMethod: {
          type: 'bolt11Invoice',
          description,
          amountSats,
        } as ReceivePaymentMethod,
      };

      const response = await this.sdk.receivePayment(request);
      return {
        paymentRequest: response.paymentRequest,
        feeSats: response.feeSats,
      };
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Wait for a specific payment to complete
   * Used to track when an invoice is paid
   */
  async waitForPayment(paymentRequest: string): Promise<Payment> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const request: WaitForPaymentRequest = {
        identifier: {
          type: 'paymentRequest',
          paymentRequest,
        },
      };

      const response: WaitForPaymentResponse = await this.sdk.waitForPayment(request);
      return response.payment;
    } catch (error) {
      console.error('Failed to wait for payment:', error);
      throw error;
    }
  }

  /**
   * Prepare a payment (get fee estimate)
   */
  async preparePayment(
    paymentRequest: string,
    amountSats?: number
  ): Promise<PrepareSendPaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const request: PrepareSendPaymentRequest = {
        paymentRequest,
        amount: amountSats ? BigInt(amountSats) : undefined,
      };

      const response = await this.sdk.prepareSendPayment(request);
      return response;
    } catch (error) {
      console.error('Failed to prepare payment:', error);
      throw error;
    }
  }

  /**
   * Send a Lightning payment
   */
  async sendPayment(paymentRequest: string, amountSats?: number): Promise<SendPaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const preparePaymentResponse = await this.preparePayment(paymentRequest, amountSats);
      const response = await this.sdk.sendPayment({
        prepareResponse: preparePaymentResponse,
      });
      return response;
    } catch (error) {
      console.error('Failed to send payment:', error);
      throw error;
    }
  }

  /**
   * Parse input to determine type (Lightning address, BOLT11, Bitcoin address, etc.)
   * Note: parse() method exists in SDK but types may not be available in 0.3.0-rc2
   */
  async parseInput(input: string): Promise<InputType> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const parsed = await this.sdk.parse(input);
      console.log('📝 [BREEZ:PARSE_INPUT] Input parsed:', parsed.type);
      return parsed;
    } catch (error) {
      console.error('Failed to parse input:', error);
      throw error;
    }
  }

  /**
   * Prepare LNURL payment (for Lightning addresses)
   */
  async prepareLnurlPay(params: PrepareLnurlPayRequest): Promise<PrepareLnurlPayResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      console.log('💸 [BREEZ:PREPARE_LNURL_PAY] Preparing LNURL payment...');
      const response = await this.sdk.prepareLnurlPay(params);
      console.log('✅ [BREEZ:PREPARE_LNURL_PAY] LNURL payment prepared');
      return response;
    } catch (error) {
      console.error('Failed to prepare LNURL payment:', error);
      throw error;
    }
  }

  /**
   * Execute LNURL payment (for Lightning addresses)
   */
  async lnurlPay(params: LnurlPayRequest): Promise<LnurlPayResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      console.log('💸 [BREEZ:LNURL_PAY] Executing LNURL payment...');
      const response = await this.sdk.lnurlPay(params);
      console.log('✅ [BREEZ:LNURL_PAY] LNURL payment executed successfully');
      return response;
    } catch (error) {
      console.error('Failed to execute LNURL payment:', error);
      throw error;
    }
  }

  /**
   * List payment history
   */
  async listPayments(): Promise<Payment[]> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const payments = await this.sdk.listPayments({});
      return payments.payments;
    } catch (error) {
      console.error('Failed to list payments:', error);
      throw error;
    }
  }

  /**
   * Get node info
   */
  async getNodeInfo(): Promise<GetInfoResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const info = await this.sdk.getInfo({ ensureSynced: true });
      return info;
    } catch (error) {
      console.error('Failed to get node info:', error);
      throw error;
    }
  }

  /**
   * Check if a Lightning address username is available
   */
  async checkLightningAddressAvailable(username: string): Promise<boolean> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const request: CheckLightningAddressRequest = { username };
      const isAvailable = await this.sdk.checkLightningAddressAvailable(request);
      return isAvailable;
    } catch (error) {
      console.error('Failed to check Lightning address availability:', error);
      throw error;
    }
  }

  /**
   * Register a Lightning address
   */
  async registerLightningAddress(
    username: string,
    description?: string
  ): Promise<LightningAddressInfo> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const request: RegisterLightningAddressRequest = {
        username,
        description: description || `Pay to ${username}@evento.cash`,
      };
      const addressInfo = await this.sdk.registerLightningAddress(request);
      return addressInfo;
    } catch (error) {
      console.error('Failed to register Lightning address:', error);
      throw error;
    }
  }

  /**
   * Get the current Lightning address information
   */
  async getLightningAddress(): Promise<LightningAddressInfo | null> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const addressInfo = await this.sdk.getLightningAddress();
      return addressInfo || null;
    } catch (error) {
      console.error('Failed to get Lightning address:', error);
      throw error;
    }
  }

  /**
   * Delete the current Lightning address
   */
  async deleteLightningAddress(): Promise<void> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      await this.sdk.deleteLightningAddress();
    } catch (error) {
      console.error('Failed to delete Lightning address:', error);
      throw error;
    }
  }

  /**
   * Format and log Breez SDK events with readable context
   */
  private logBreezEvent(event: SdkEvent): void {
    const timestamp = new Date().toLocaleTimeString();

    switch (event.type) {
      case 'synced':
        console.log(`🔄 [BREEZ:SYNCED] ${timestamp} - Wallet synchronized with network`);
        break;

      case 'paymentSucceeded': {
        const payment = (event as any).payment;
        const direction = payment?.paymentType === 'received' ? 'Incoming' : 'Outgoing';
        const amount = payment?.amountSats || 0;
        console.log(
          `💰 [BREEZ:PAYMENT_SUCCEEDED] ${timestamp} - ${direction}: ${amount.toLocaleString()} sats`,
          payment
        );
        break;
      }

      case 'paymentFailed': {
        const payment = (event as any).payment;
        const direction = payment?.paymentType === 'received' ? 'Incoming' : 'Outgoing';
        const amount = payment?.amountSats || 0;
        console.log(
          `❌ [BREEZ:PAYMENT_FAILED] ${timestamp} - ${direction} payment failed: ${amount.toLocaleString()} sats`,
          payment
        );
        break;
      }

      case 'claimDepositsSucceeded': {
        const deposits = (event as any).claimedDeposits || [];
        console.log(
          `📥 [BREEZ:CLAIM_DEPOSITS_SUCCEEDED] ${timestamp} - Claimed ${deposits.length} deposit(s)`,
          deposits
        );
        break;
      }

      case 'claimDepositsFailed': {
        const deposits = (event as any).unclaimedDeposits || [];
        console.log(
          `⚠️ [BREEZ:CLAIM_DEPOSITS_FAILED] ${timestamp} - Failed to claim ${deposits.length} deposit(s)`,
          deposits
        );
        break;
      }

      default:
        console.log(`🔔 [BREEZ:UNKNOWN_EVENT] ${timestamp}`, event);
        break;
    }
  }

  /**
   * Set up event listener for SDK events
   */
  private async setupEventListener(): Promise<void> {
    if (!this.sdk) return;

    try {
      const eventListener: EventListener = {
        onEvent: async (event: SdkEvent) => {
          // Log all events with formatted output
          this.logBreezEvent(event);

          // Notify all registered callbacks
          this.eventCallbacks.forEach((callback) => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in event callback:', error);
            }
          });
        },
      };

      this.eventListenerId = await this.sdk.addEventListener(eventListener);
      console.log('Event listener registered:', this.eventListenerId);
    } catch (error) {
      console.error('Failed to set up event listener:', error);
    }
  }

  /**
   * Register a callback for SDK events
   */
  onEvent(callback: (event: SdkEvent) => void): () => void {
    this.eventCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }
}

export const breezSDK = BreezSDKService.getInstance();
