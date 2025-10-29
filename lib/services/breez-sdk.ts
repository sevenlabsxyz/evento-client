import {
  BreezSdk,
  CheckLightningAddressRequest,
  Config,
  ConnectRequest,
  EventListener,
  GetInfoResponse,
  LightningAddressInfo,
  Network,
  Payment,
  PrepareSendPaymentRequest,
  PrepareSendPaymentResponse,
  ReceivePaymentMethod,
  ReceivePaymentRequest,
  RegisterLightningAddressRequest,
  SdkEvent,
  Seed,
  SendPaymentResponse,
} from '@breeztech/breez-sdk-spark';

let sdkInstance: BreezSdk | null = null;
let isInitializing = false;
let initializationError: Error | null = null;
let sdkModule: any = null;

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
    if (sdkInstance) {
      return sdkInstance;
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
      config.lnurlDomain = 'evt.cash';

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

      // Set up event listener
      await this.setupEventListener();

      console.log('Breez SDK connected successfully');
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
        // Remove event listener
        if (this.eventListenerId) {
          await this.sdk.removeEventListener(this.eventListenerId);
          this.eventListenerId = null;
        }

        await this.sdk.disconnect();
        this.sdk = null;
        sdkInstance = null;
        this.eventCallbacks.clear();
        console.log('Breez SDK disconnected');
      } catch (error) {
        console.error('Failed to disconnect from Breez SDK:', error);
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
      const nodeInfo = await this.sdk.getInfo({ ensureSynced: true });
      return Number(nodeInfo.balanceSats);
    } catch (error) {
      console.error('Failed to get balance:', error);
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
        description: description || `Pay to ${username}@evt.cash`,
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
   * Set up event listener for SDK events
   */
  private async setupEventListener(): Promise<void> {
    if (!this.sdk) return;

    try {
      const eventListener: EventListener = {
        onEvent: async (event: SdkEvent) => {
          console.log('Breez SDK Event:', event);

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
