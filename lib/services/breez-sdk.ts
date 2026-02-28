import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { toast } from '@/lib/utils/toast';
import {
  BreezSdk,
  CheckLightningAddressRequest,
  ClaimDepositRequest,
  Config,
  ConnectRequest,
  DepositInfo,
  EventListener,
  Fee,
  GetInfoResponse,
  InputType,
  LightningAddressInfo,
  LnurlPayRequest,
  LnurlPayResponse,
  MaxFee,
  Network,
  Payment,
  PrepareLnurlPayRequest,
  PrepareLnurlPayResponse,
  PrepareSendPaymentRequest,
  PrepareSendPaymentResponse,
  ReceivePaymentMethod,
  ReceivePaymentRequest,
  ReceivePaymentResponse,
  RefundDepositRequest,
  RegisterLightningAddressRequest,
  SdkEvent,
  Seed,
  SendPaymentRequest,
  SendPaymentResponse,
} from '@breeztech/breez-sdk-spark/web';

// Set to true to enable verbose logging
const DEBUG_BREEZ = false;

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

    if (DEBUG_BREEZ) {
      console.debug('🔑 [BREEZ:CONNECT] Attempting to connect wallet');
      console.debug('🔑 [BREEZ:CONNECT] New wallet fingerprint', {
        fingerprint: newFingerprint,
      });
      console.debug('🔑 [BREEZ:CONNECT] Current wallet fingerprint', {
        fingerprint: currentWalletFingerprint || 'none',
      });
      console.debug('🔑 [BREEZ:CONNECT] SDK instance exists', {
        exists: sdkInstance !== null,
      });
    }

    if (sdkInstance) {
      if (currentWalletFingerprint === newFingerprint) {
        if (DEBUG_BREEZ) {
          console.debug('✅ [BREEZ:CONNECT] Same wallet, returning existing SDK instance');
        }
        return sdkInstance;
      } else {
        if (DEBUG_BREEZ) {
          console.warn('⚠️ [BREEZ:CONNECT] Different wallet detected!', {
            currentFingerprint: currentWalletFingerprint,
            newFingerprint,
          });
        }

        try {
          if (DEBUG_BREEZ) console.info('🔌 [BREEZ:CONNECT] Disconnecting existing wallet...');
          await this.disconnect();
        } catch (error) {
          if (DEBUG_BREEZ) {
            console.warn(
              '⚠️ [BREEZ:CONNECT] Failed to disconnect existing wallet, continuing',
              error
            );
          }
        }

        // Continue to create new SDK instance for the new wallet
        currentWalletFingerprint = newFingerprint;
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
        if (DEBUG_BREEZ) {
          console.debug('Loading Breez SDK module...');
        }
        sdkModule = await import('@breeztech/breez-sdk-spark/web');

        // Initialize WASM if there's a default export (initialization function)
        if (sdkModule.default && typeof sdkModule.default === 'function') {
          if (DEBUG_BREEZ) {
            console.debug('Initializing Breez SDK WASM...');
          }
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
        console.error('Failed to get default config', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw new Error(
          'Failed to initialize Breez SDK. The WASM module may not be loaded properly.'
        );
      }

      config.apiKey = apiKey;
      // Configure LNURL domain for Lightning addresses
      config.lnurlDomain = 'evento.cash';
      config.supportLnurlVerify = true;
      // Enable auto-claiming of on-chain deposits (Bitcoin → Lightning conversion)
      // Auto-claims if fee is ≤ 10 sat/vbyte (~2,000 sats for a typical 200 vbyte swap tx)
      // This covers most normal fee environments; only extreme spikes require manual claiming
      config.maxDepositClaimFee = { type: 'rate', satPerVbyte: 10 } as MaxFee;

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

      if (DEBUG_BREEZ) {
        console.debug('✅ [BREEZ:CONNECT] Breez SDK connected successfully');
        console.debug('✅ [BREEZ:CONNECT] Wallet fingerprint', {
          fingerprint: currentWalletFingerprint,
        });
      }
      return this.sdk!;
    } catch (error: any) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CONNECTING);
      initializationError = error;
      isInitializing = false;

      // Provide helpful error message
      if (error.message?.includes('defaultConfig')) {
        throw new Error(
          'Breez SDK initialization failed. Please refresh the page and try again. If the issue persists, check that the Breez SDK package is properly installed.'
        );
      }

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
        if (DEBUG_BREEZ) {
          console.debug('🔌 [BREEZ:DISCONNECT] Disconnecting wallet...');
          console.debug('🔌 [BREEZ:DISCONNECT] Current wallet fingerprint', {
            fingerprint: currentWalletFingerprint || 'unknown',
          });
        }

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

        if (DEBUG_BREEZ) {
          console.debug('✅ [BREEZ:DISCONNECT] Breez SDK disconnected successfully');
          console.debug('✅ [BREEZ:DISCONNECT] Wallet fingerprint cleared');
        }
      } catch (error) {
        logBreezError(error, BREEZ_ERROR_CONTEXT.DISCONNECTING);
        const userMessage = getBreezErrorMessage(error, 'disconnect wallet');
        throw new Error(userMessage);
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
      if (DEBUG_BREEZ) {
        console.debug('💰 [BREEZ:GET_BALANCE] Fetching wallet balance...');
        console.debug('💰 [BREEZ:GET_BALANCE] Wallet fingerprint', {
          fingerprint: currentWalletFingerprint || 'unknown',
        });
      }

      const nodeInfo = await this.sdk.getInfo({ ensureSynced: true });

      if (DEBUG_BREEZ) {
        console.debug('💰 [BREEZ:GET_BALANCE] Balance fetched');
        console.debug('💰 [BREEZ:GET_BALANCE] Full nodeInfo', { nodeInfo });
        console.debug('💰 [BREEZ:GET_BALANCE] balanceSats', {
          balanceSats: nodeInfo.balanceSats,
        });
        console.debug('💰 [BREEZ:GET_BALANCE] Wallet fingerprint', {
          fingerprint: currentWalletFingerprint || 'unknown',
        });
      }

      return Number(nodeInfo.balanceSats);
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.FETCHING_BALANCE);
      const userMessage = getBreezErrorMessage(error, 'fetch balance');
      throw new Error(userMessage);
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
        feeSats: Number(response.fee),
      };
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CREATING_INVOICE);
      const userMessage = getBreezErrorMessage(error, 'create invoice');
      throw new Error(userMessage);
    }
  }

  /**
   * Receive payment via Bitcoin address or Lightning invoice
   * Used to generate on-chain Bitcoin addresses that auto-convert to Lightning
   */
  async receivePayment(request: ReceivePaymentRequest): Promise<ReceivePaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ)
        console.debug('📥 [BREEZ:RECEIVE_PAYMENT] Generating payment method', {
          type: request.paymentMethod.type,
        });
      const response = await this.sdk.receivePayment(request);
      if (DEBUG_BREEZ)
        console.debug('✅ [BREEZ:RECEIVE_PAYMENT] Payment method generated successfully');
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.RECEIVING_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'generate payment method');
      throw new Error(userMessage);
    }
  }

  /**
   * Prepare a send payment transaction
   * Used to get fee estimates before sending Bitcoin on-chain or Lightning payments
   */
  async prepareSendPayment(
    request: PrepareSendPaymentRequest
  ): Promise<PrepareSendPaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ) console.debug('⚡ [BREEZ:PREPARE_SEND] Preparing send payment...');
      const response = await this.sdk.prepareSendPayment(request);
      if (DEBUG_BREEZ) {
        console.debug('✅ [BREEZ:PREPARE_SEND] Send payment prepared successfully');
      }
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.PREPARING_SEND_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'prepare payment');
      throw new Error(userMessage);
    }
  }

  /**
   * Wait for a specific payment to complete
   * Used to track when an invoice is paid
   * Implemented using polling since SDK 0.7.x removed waitForPayment
   */
  async waitForPayment(paymentRequest: string): Promise<Payment> {
    if (!this.sdk) throw new Error('SDK not connected');

    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_WAIT_TIME = 3600000; // 1 hour timeout
    const startTime = Date.now();
    const normalizedInvoice = paymentRequest.toLowerCase();

    try {
      return await new Promise<Payment>((resolve, reject) => {
        const checkPayment = async () => {
          // Check timeout
          if (Date.now() - startTime > MAX_WAIT_TIME) {
            reject(new Error('Timeout waiting for payment'));
            return;
          }

          try {
            // List recent payments and find one matching the invoice
            const payments = await this.sdk!.listPayments({});
            const matchingPayment = payments.payments.find((p) => {
              if (p.details?.type === 'lightning') {
                return p.details.invoice?.toLowerCase() === normalizedInvoice;
              }
              return false;
            });

            if (matchingPayment && matchingPayment.status === 'completed') {
              resolve(matchingPayment);
              return;
            }

            // Payment not found or not completed yet, poll again
            setTimeout(checkPayment, POLL_INTERVAL);
          } catch (error: any) {
            // Distinguish between transient and permanent errors
            const isTransientError =
              error?.message?.includes?.('network') ||
              error?.message?.includes?.('connection') ||
              error?.message?.includes?.('timeout') ||
              error?.message?.includes?.('temporarily') ||
              error?.code === 'NETWORK_ERROR' ||
              error?.code === 'TIMEOUT';

            const isPermanentError =
              error?.message?.includes?.('invalid') ||
              error?.message?.includes?.('unauthorized') ||
              error?.message?.includes?.('disconnected') ||
              error?.message?.includes?.('API key') ||
              error?.code === 'INVALID_API_KEY' ||
              error?.code === 'SDK_DISCONNECTED';

            if (isPermanentError) {
              // Fail fast on permanent errors
              if (DEBUG_BREEZ)
                console.debug('Permanent error detected, failing immediately', { error });
              reject(error);
              return;
            }

            if (isTransientError || !isPermanentError) {
              // Continue polling on transient or unknown errors
              if (DEBUG_BREEZ) console.debug('Transient error, will retry', { error });
              setTimeout(checkPayment, POLL_INTERVAL);
            } else {
              // Unknown error type - be conservative and retry
              if (DEBUG_BREEZ) console.debug('Unknown error type, will retry', { error });
              setTimeout(checkPayment, POLL_INTERVAL);
            }
          }
        };

        // Start polling
        checkPayment();
      });
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.WAITING_FOR_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'wait for payment');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.PREPARING_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'prepare payment');
      throw new Error(userMessage);
    }
  }

  /**
   * Prepare a send-all payment (fees deducted from balance)
   * Uses FeePolicy 'feesIncluded' so the full amount minus fees is sent to the recipient.
   * Useful for draining the wallet or sending the entire balance to a Bitcoin address.
   */
  async prepareSendAll(
    paymentRequest: string,
    amountSats: number
  ): Promise<PrepareSendPaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ) console.debug('⚡ [BREEZ:PREPARE_SEND_ALL] Preparing send-all payment...');
      const request: PrepareSendPaymentRequest = {
        paymentRequest,
        amount: BigInt(amountSats),
        feePolicy: 'feesIncluded',
      };

      const response = await this.sdk.prepareSendPayment(request);
      if (DEBUG_BREEZ) {
        console.debug('✅ [BREEZ:PREPARE_SEND_ALL] Send-all payment prepared successfully', {
          amount: Number(response.amount),
          feePolicy: response.feePolicy,
        });
      }
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.PREPARING_SEND_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'prepare send-all payment');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.SENDING_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'send payment');
      throw new Error(userMessage);
    }
  }

  /**
   * Send payment with custom options
   * Used for Bitcoin on-chain payments with fee selection or Lightning with custom parameters
   */
  async sendPaymentWithOptions(request: SendPaymentRequest): Promise<SendPaymentResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ)
        console.debug('💸 [BREEZ:SEND_PAYMENT_OPTIONS] Sending payment with options...');
      const response = await this.sdk.sendPayment(request);
      if (DEBUG_BREEZ) console.debug('✅ [BREEZ:SEND_PAYMENT_OPTIONS] Payment sent successfully');
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.SENDING_PAYMENT_WITH_OPTIONS);
      const userMessage = getBreezErrorMessage(error, 'send payment');
      throw new Error(userMessage);
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
      if (DEBUG_BREEZ) console.debug('📝 [BREEZ:PARSE_INPUT] Input parsed', { type: parsed.type });
      return parsed;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.PARSING_INPUT);
      const userMessage = getBreezErrorMessage(error, 'parse input');
      throw new Error(userMessage);
    }
  }

  /**
   * Prepare LNURL payment (for Lightning addresses)
   */
  async prepareLnurlPay(params: PrepareLnurlPayRequest): Promise<PrepareLnurlPayResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ) console.debug('💸 [BREEZ:PREPARE_LNURL_PAY] Preparing LNURL payment...');
      const response = await this.sdk.prepareLnurlPay(params);
      if (DEBUG_BREEZ) console.debug('✅ [BREEZ:PREPARE_LNURL_PAY] LNURL payment prepared');
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.PREPARING_LNURL_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'prepare Lightning address payment');
      throw new Error(userMessage);
    }
  }

  /**
   * Execute LNURL payment (for Lightning addresses)
   */
  async lnurlPay(params: LnurlPayRequest): Promise<LnurlPayResponse> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ) console.debug('💸 [BREEZ:LNURL_PAY] Executing LNURL payment...');
      const response = await this.sdk.lnurlPay(params);
      if (DEBUG_BREEZ) console.debug('✅ [BREEZ:LNURL_PAY] LNURL payment executed successfully');
      return response;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.EXECUTING_LNURL_PAYMENT);
      const userMessage = getBreezErrorMessage(error, 'send Lightning address payment');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.LISTING_PAYMENTS);
      const userMessage = getBreezErrorMessage(error, 'fetch payment history');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.FETCHING_NODE_INFO);
      const userMessage = getBreezErrorMessage(error, 'fetch wallet info');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.CHECKING_LIGHTNING_ADDRESS_AVAILABILITY);
      const userMessage = getBreezErrorMessage(error, 'check Lightning address availability');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.REGISTERING_LIGHTNING_ADDRESS);
      const userMessage = getBreezErrorMessage(error, 'register Lightning address');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.FETCHING_LIGHTNING_ADDRESS);
      const userMessage = getBreezErrorMessage(error, 'fetch Lightning address');
      throw new Error(userMessage);
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
      logBreezError(error, BREEZ_ERROR_CONTEXT.DELETING_LIGHTNING_ADDRESS);
      const userMessage = getBreezErrorMessage(error, 'delete Lightning address');
      throw new Error(userMessage);
    }
  }

  /**
   * List unclaimed on-chain deposits
   * These are deposits that couldn't be auto-claimed (e.g., fee exceeded maxDepositClaimFee)
   */
  async listUnclaimedDeposits(): Promise<DepositInfo[]> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      const result = await this.sdk.listUnclaimedDeposits({});
      return result.deposits;
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.LISTING_UNCLAIMED_DEPOSITS);
      const userMessage = getBreezErrorMessage(error, 'fetch unclaimed deposits');
      throw new Error(userMessage);
    }
  }

  /**
   * Manually claim an on-chain deposit (convert to Lightning)
   * Used when auto-claiming fails due to high fees
   */
  async claimDeposit(txid: string, vout: number, maxFee: Fee): Promise<void> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ)
        console.debug(`💰 [BREEZ:CLAIM_DEPOSIT] Claiming deposit ${txid}:${vout}`, { maxFee });
      const request: ClaimDepositRequest = { txid, vout, maxFee };
      await this.sdk.claimDeposit(request);
      if (DEBUG_BREEZ)
        console.debug(`✅ [BREEZ:CLAIM_DEPOSIT] Successfully claimed deposit ${txid}:${vout}`);
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CLAIMING_DEPOSIT);
      const userMessage = getBreezErrorMessage(error, 'claim deposit');
      throw new Error(userMessage);
    }
  }

  /**
   * Refund an on-chain deposit back to a Bitcoin address
   * Useful if user wants to send to cold storage instead of claiming to Lightning
   */
  async refundDeposit(
    txid: string,
    vout: number,
    destinationAddress: string,
    fee: Fee
  ): Promise<void> {
    if (!this.sdk) throw new Error('SDK not connected');

    try {
      if (DEBUG_BREEZ)
        console.debug(
          `🔄 [BREEZ:REFUND_DEPOSIT] Refunding deposit ${txid}:${vout} to ${destinationAddress}`
        );
      const request: RefundDepositRequest = {
        txid,
        vout,
        destinationAddress,
        fee,
      };
      await this.sdk.refundDeposit(request);
      if (DEBUG_BREEZ)
        console.debug(`✅ [BREEZ:REFUND_DEPOSIT] Successfully refunded deposit ${txid}:${vout}`);
    } catch (error) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.REFUNDING_DEPOSIT);
      const userMessage = getBreezErrorMessage(error, 'refund deposit');
      throw new Error(userMessage);
    }
  }

  /**
   * Format and log Breez SDK events with readable context
   */
  private logBreezEvent(event: SdkEvent): void {
    const timestamp = new Date().toLocaleTimeString();

    switch (event.type) {
      case 'synced':
        if (DEBUG_BREEZ)
          console.debug(`🔄 [BREEZ:SYNCED] ${timestamp} - Wallet synchronized with network`);
        break;

      case 'paymentSucceeded': {
        const payment = (event as any).payment;
        const isIncoming = payment?.paymentType === 'receive';
        const direction = isIncoming ? 'Incoming' : 'Outgoing';
        const amount = Number(payment?.amount || BigInt(0));
        if (DEBUG_BREEZ) {
          console.debug(
            `💰 [BREEZ:PAYMENT_SUCCEEDED] ${timestamp} - ${direction}: ${amount.toLocaleString()} sats`,
            { payment }
          );
        }

        // Show toast for incoming payments (always, not just debug)
        if (isIncoming) {
          toast.success(`+${amount.toLocaleString()} sats received`);
        }
        break;
      }

      case 'paymentFailed': {
        const payment = (event as any).payment;
        const direction = payment?.paymentType === 'received' ? 'Incoming' : 'Outgoing';
        const amount = payment?.amountSats || 0;
        if (DEBUG_BREEZ) {
          console.debug(
            `❌ [BREEZ:PAYMENT_FAILED] ${timestamp} - ${direction} payment failed: ${amount.toLocaleString()} sats`,
            { payment }
          );
        }
        break;
      }

      case 'claimedDeposits': {
        const deposits = (event as any).claimedDeposits || [];
        const totalAmount = deposits.reduce((sum: number, d: any) => sum + (d.amountSats || 0), 0);
        if (DEBUG_BREEZ) {
          console.debug(
            `📥 [BREEZ:CLAIMED_DEPOSITS] ${timestamp} - Auto-claimed ${
              deposits.length
            } deposit(s) (${totalAmount.toLocaleString()} sats total)`,
            { deposits }
          );
        }
        break;
      }

      case 'unclaimedDeposits': {
        const deposits = (event as any).unclaimedDeposits || [];
        const totalAmount = deposits.reduce((sum: number, d: any) => sum + (d.amountSats || 0), 0);
        if (DEBUG_BREEZ) {
          console.debug(
            `⚠️ [BREEZ:UNCLAIMED_DEPOSITS] ${timestamp} - Failed to auto-claim ${
              deposits.length
            } deposit(s) (${totalAmount.toLocaleString()} sats total)`,
            { deposits }
          );
          console.debug('⚠️ [BREEZ:UNCLAIMED_DEPOSITS] Reason: Fee exceeded maxDepositClaimFee (10 sat/vbyte)');
          console.debug('⚠️ [BREEZ:UNCLAIMED_DEPOSITS] Action required: User must manually claim');
        }
        break;
      }

      default:
        if (DEBUG_BREEZ) console.debug(`🔔 [BREEZ:UNKNOWN_EVENT] ${timestamp}`, { event });
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
              console.error('Error in event callback', {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        },
      };

      this.eventListenerId = await this.sdk.addEventListener(eventListener);
      if (DEBUG_BREEZ)
        console.debug('Event listener registered', { listenerId: this.eventListenerId });
    } catch (error) {
      console.error('Failed to set up event listener', {
        error: error instanceof Error ? error.message : String(error),
      });
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

// Re-export types for use in components
export type { DepositInfo, Fee, FeePolicy } from '@breeztech/breez-sdk-spark/web';
