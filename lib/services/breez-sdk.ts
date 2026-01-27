/**
 * Breez SDK Spark Service - Version 0.7.12
 *
 * BREAKING CHANGES from 0.4.x to 0.7.x:
 * 1. ReceivePaymentResponse.feeSats → fee (bigint)
 * 2. Payment.amountSats → amount (bigint)
 * 3. Payment.paymentType values: 'received'/'sent' → 'receive'/'send'
 * 4. Payment.paymentTime → timestamp
 * 5. waitForPayment method removed - use event-based approach
 * 6. SdkEvent: 'claimDepositsSucceeded'/'claimDepositsFailed' → 'claimedDeposits'/'unclaimedDeposits'
 * 7. Added new features: token support, Spark addresses, optimization
 */

import type {
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
} from '@breeztech/breez-sdk-spark/web';

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
  private paymentWaiters: Map<
    string,
    { resolve: (payment: Payment) => void; reject: (error: Error) => void }
  > = new Map();

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

    console.log('[BREEZ:CONNECT] Attempting to connect wallet');
    console.log('  -> New wallet fingerprint:', newFingerprint);
    console.log('  -> Current wallet fingerprint:', currentWalletFingerprint || 'none');
    console.log('  -> SDK instance exists:', sdkInstance !== null);

    if (sdkInstance) {
      if (currentWalletFingerprint === newFingerprint) {
        console.log('[BREEZ:CONNECT] Same wallet, returning existing SDK instance');
        return sdkInstance;
      } else {
        console.warn('[BREEZ:CONNECT] Different wallet detected!');
        console.warn('  -> Current:', currentWalletFingerprint);
        console.warn('  -> New:', newFingerprint);
        console.warn('  -> Returning existing instance anyway (THIS IS THE BUG)');
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

      // Dynamically import the SDK module (use /web subpath for browser)
      if (!sdkModule) {
        console.log('Loading Breez SDK module...');
        sdkModule = await import('@breeztech/breez-sdk-spark/web');

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

      console.log('[BREEZ:CONNECT] Breez SDK connected successfully');
      console.log('  -> Wallet fingerprint:', currentWalletFingerprint);
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
        console.log('[BREEZ:DISCONNECT] Disconnecting wallet...');
        console.log('  -> Current wallet fingerprint:', currentWalletFingerprint || 'unknown');

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
        this.paymentWaiters.clear();

        console.log('[BREEZ:DISCONNECT] Breez SDK disconnected successfully');
        console.log('  -> Wallet fingerprint cleared');
      } catch (error) {
        console.error('[BREEZ:DISCONNECT] Failed to disconnect from Breez SDK:', error);
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
      console.log('[BREEZ:GET_BALANCE] Fetching wallet balance...');
      console.log('  -> Wallet fingerprint:', currentWalletFingerprint || 'unknown');

      const nodeInfo = await this.sdk.getInfo({ ensureSynced: true });

      console.log('[BREEZ:GET_BALANCE] Balance fetched');
      console.log('  -> Full nodeInfo:', nodeInfo);
      console.log('  -> balanceSats:', nodeInfo.balanceSats);
      console.log('  -> Wallet fingerprint:', currentWalletFingerprint || 'unknown');

      return Number(nodeInfo.balanceSats);
    } catch (error) {
      console.error('[BREEZ:GET_BALANCE] Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Create a Lightning invoice to receive payment
   *
   * BREAKING CHANGE (0.7.x): Response field 'feeSats' is now 'fee' (bigint)
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

      // BREAKING CHANGE: fee is now bigint, convert to number for backwards compatibility
      return {
        paymentRequest: response.paymentRequest,
        feeSats: Number(response.fee),
      };
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Wait for a specific payment to complete
   * Used to track when an invoice is paid
   *
   * BREAKING CHANGE (0.7.x): waitForPayment method was removed from SDK.
   * Now implemented using event listeners internally.
   */
  async waitForPayment(paymentRequest: string): Promise<Payment> {
    if (!this.sdk) throw new Error('SDK not connected');

    return new Promise((resolve, reject) => {
      // Store the waiter
      this.paymentWaiters.set(paymentRequest, { resolve, reject });

      // Set a timeout (1 hour max wait)
      const timeout = setTimeout(() => {
        this.paymentWaiters.delete(paymentRequest);
        reject(new Error('Payment wait timeout'));
      }, 60 * 60 * 1000);

      // Modify the reject to clear timeout
      const originalReject = reject;
      const wrappedReject = (error: Error) => {
        clearTimeout(timeout);
        this.paymentWaiters.delete(paymentRequest);
        originalReject(error);
      };

      // Modify the resolve to clear timeout
      const originalResolve = resolve;
      const wrappedResolve = (payment: Payment) => {
        clearTimeout(timeout);
        this.paymentWaiters.delete(paymentRequest);
        originalResolve(payment);
      };

      this.paymentWaiters.set(paymentRequest, {
        resolve: wrappedResolve,
        reject: wrappedReject,
      });
    });
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
   */
  async parseInput(input: string): Promise<InputType> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const parsed = await this.sdk.parse(input);
      console.log('[BREEZ:PARSE_INPUT] Input parsed:', parsed.type);
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
      console.log('[BREEZ:PREPARE_LNURL_PAY] Preparing LNURL payment...');
      const response = await this.sdk.prepareLnurlPay(params);
      console.log('[BREEZ:PREPARE_LNURL_PAY] LNURL payment prepared');
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
      console.log('[BREEZ:LNURL_PAY] Executing LNURL payment...');
      const response = await this.sdk.lnurlPay(params);
      console.log('[BREEZ:LNURL_PAY] LNURL payment executed successfully');
      return response;
    } catch (error) {
      console.error('Failed to execute LNURL payment:', error);
      throw error;
    }
  }

  /**
   * List payment history
   *
   * BREAKING CHANGE (0.7.x): listPayments now returns ListPaymentsResponse with 'payments' array
   */
  async listPayments(): Promise<Payment[]> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const response = await this.sdk.listPayments({});
      return response.payments;
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
   *
   * BREAKING CHANGE (0.7.x):
   * - 'claimDepositsSucceeded' → 'claimedDeposits'
   * - 'claimDepositsFailed' → (handled via unclaimedDeposits with errors)
   * - Payment.paymentType: 'received'/'sent' → 'receive'/'send'
   */
  private logBreezEvent(event: SdkEvent): void {
    const timestamp = new Date().toLocaleTimeString();

    switch (event.type) {
      case 'synced':
        console.log(`[BREEZ:SYNCED] ${timestamp} - Wallet synchronized with network`);
        break;

      case 'paymentSucceeded': {
        const payment = event.payment;
        // BREAKING CHANGE: paymentType is now 'receive'/'send' instead of 'received'/'sent'
        const direction = payment?.paymentType === 'receive' ? 'Incoming' : 'Outgoing';
        // BREAKING CHANGE: amount is now bigint
        const amount = payment?.amount ? Number(payment.amount) : 0;
        console.log(
          `[BREEZ:PAYMENT_SUCCEEDED] ${timestamp} - ${direction}: ${amount.toLocaleString()} sats`,
          payment
        );
        break;
      }

      case 'paymentPending': {
        const payment = event.payment;
        const direction = payment?.paymentType === 'receive' ? 'Incoming' : 'Outgoing';
        const amount = payment?.amount ? Number(payment.amount) : 0;
        console.log(
          `[BREEZ:PAYMENT_PENDING] ${timestamp} - ${direction} pending: ${amount.toLocaleString()} sats`,
          payment
        );
        break;
      }

      case 'paymentFailed': {
        const payment = event.payment;
        const direction = payment?.paymentType === 'receive' ? 'Incoming' : 'Outgoing';
        const amount = payment?.amount ? Number(payment.amount) : 0;
        console.log(
          `[BREEZ:PAYMENT_FAILED] ${timestamp} - ${direction} payment failed: ${amount.toLocaleString()} sats`,
          payment
        );
        break;
      }

      // BREAKING CHANGE: claimDepositsSucceeded → claimedDeposits
      case 'claimedDeposits': {
        const deposits = event.claimedDeposits || [];
        console.log(
          `[BREEZ:CLAIMED_DEPOSITS] ${timestamp} - Claimed ${deposits.length} deposit(s)`,
          deposits
        );
        break;
      }

      // BREAKING CHANGE: claimDepositsFailed → unclaimedDeposits
      case 'unclaimedDeposits': {
        const deposits = event.unclaimedDeposits || [];
        console.log(
          `[BREEZ:UNCLAIMED_DEPOSITS] ${timestamp} - ${deposits.length} unclaimed deposit(s)`,
          deposits
        );
        break;
      }

      case 'optimization': {
        const optEvent = event.optimizationEvent;
        console.log(`[BREEZ:OPTIMIZATION] ${timestamp} - Optimization event:`, optEvent);
        break;
      }

      default:
        console.log(`[BREEZ:UNKNOWN_EVENT] ${timestamp}`, event);
        break;
    }
  }

  /**
   * Handle payment events for waitForPayment implementation
   */
  private handlePaymentEvent(event: SdkEvent): void {
    if (event.type === 'paymentSucceeded') {
      const payment = event.payment;
      if (payment?.details?.type === 'lightning') {
        const invoice = payment.details.invoice;
        const waiter = this.paymentWaiters.get(invoice);
        if (waiter) {
          waiter.resolve(payment);
        }
      }
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

          // Handle payment events for waitForPayment
          this.handlePaymentEvent(event);

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
