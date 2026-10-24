import { translateHooks } from '@/lib/i18n/active-translator';
import { logger } from '@/lib/utils/logger';

/**
 * Constant strings for error contexts
 * Use these instead of string literals to prevent typos
 */
export const BREEZ_ERROR_CONTEXT = {
  // SDK Connection
  CONNECTING: 'connecting to Breez SDK',
  DISCONNECTING: 'disconnecting from Breez SDK',

  // Wallet Operations
  CREATING_WALLET: 'creating wallet',
  RESTORING_WALLET: 'restoring wallet from backup',
  RESTORING_FROM_MNEMONIC: 'restoring wallet from mnemonic',
  UNLOCKING_WALLET: 'unlocking wallet',
  LOCKING_WALLET: 'locking wallet',
  INITIALIZING_WALLET: 'initializing wallet',
  AUTO_CONNECTING_WALLET: 'auto-connecting wallet on init',

  // Balance Operations
  FETCHING_BALANCE: 'fetching wallet balance',
  REFRESHING_BALANCE: 'refreshing balance',

  // Invoice Operations
  CREATING_INVOICE: 'creating invoice',

  // Payment Operations
  RECEIVING_PAYMENT: 'receiving payment',
  PREPARING_PAYMENT: 'preparing payment',
  PREPARING_SEND_PAYMENT: 'preparing send payment',
  SENDING_PAYMENT: 'sending payment',
  SENDING_PAYMENT_WITH_OPTIONS: 'sending payment with options',
  WAITING_FOR_PAYMENT: 'waiting for payment',
  PARSING_INPUT: 'parsing input',
  PARSING_PAYMENT_INPUT: 'parsing payment input',

  // LNURL Operations
  PREPARING_LNURL_PAYMENT: 'preparing LNURL payment',
  EXECUTING_LNURL_PAYMENT: 'executing LNURL payment',
  EXECUTING_LNURL_WITHDRAW: 'executing LNURL withdraw',

  // Payment History
  LISTING_PAYMENTS: 'listing payments',
  FETCHING_PAYMENT_HISTORY: 'fetching payment history',

  // Node Info
  FETCHING_NODE_INFO: 'fetching node info',

  // Lightning Address Operations
  CHECKING_LIGHTNING_ADDRESS_AVAILABILITY: 'checking Lightning address availability',
  REGISTERING_LIGHTNING_ADDRESS: 'registering Lightning address',
  LOADING_LIGHTNING_ADDRESS: 'loading Lightning address',
  FETCHING_LIGHTNING_ADDRESS: 'fetching Lightning address',
  DELETING_LIGHTNING_ADDRESS: 'deleting Lightning address',

  // Deposit Operations
  BUYING_BITCOIN: 'buying Bitcoin',
  LISTING_UNCLAIMED_DEPOSITS: 'listing unclaimed deposits',
  CLAIMING_DEPOSIT: 'claiming deposit',
  REFUNDING_DEPOSIT: 'refunding deposit',

  // Zap Operations
  SENDING_ZAP: 'sending zap',

  // Contact Operations
  ADDING_CONTACT: 'adding contact',
  UPDATING_CONTACT: 'updating contact',
  DELETING_CONTACT: 'deleting contact',
  LISTING_CONTACTS: 'listing contacts',
  FETCHING_CONTACT_PROFILE: 'fetching contact profile',
} as const;

export interface BreezErrorInfo {
  userMessage: string;
  originalError: string;
  shouldRetry: boolean;
  category: 'network' | 'payment' | 'balance' | 'validation' | 'provider' | 'unknown';
}

type BreezMessageKey = Exclude<keyof IntlMessages['hooks']['breez'], 'contexts'>;
type BreezContextKey = keyof IntlMessages['hooks']['breez']['contexts'];

/**
 * Error message dictionary for common Breez SDK errors
 * Maps error patterns to user-friendly message keys (`hooks.breez.*`)
 */
const ERROR_MESSAGES: Record<
  string,
  {
    messageKey: BreezMessageKey;
    category: BreezErrorInfo['category'];
    shouldRetry: boolean;
  }
> = {
  // Network/Connection errors
  network: { messageKey: 'network', category: 'network', shouldRetry: true },
  timeout: { messageKey: 'timeout', category: 'network', shouldRetry: true },
  connection: { messageKey: 'connection', category: 'network', shouldRetry: true },
  offline: { messageKey: 'offline', category: 'network', shouldRetry: true },

  // Payment errors
  insufficient: { messageKey: 'insufficient', category: 'balance', shouldRetry: false },
  'invoice expired': { messageKey: 'invoiceExpired', category: 'payment', shouldRetry: false },
  'invoice already paid': {
    messageKey: 'invoiceAlreadyPaid',
    category: 'payment',
    shouldRetry: false,
  },
  'payment failed': { messageKey: 'paymentFailed', category: 'payment', shouldRetry: true },
  'no route': { messageKey: 'noRoute', category: 'payment', shouldRetry: true },
  'route not found': { messageKey: 'routeNotFound', category: 'payment', shouldRetry: true },
  'amount too low': { messageKey: 'amountTooLow', category: 'validation', shouldRetry: false },
  'amount too high': { messageKey: 'amountTooHigh', category: 'validation', shouldRetry: false },
  'amount out of range': {
    messageKey: 'amountOutOfRange',
    category: 'validation',
    shouldRetry: false,
  },

  // Validation errors
  invalid: { messageKey: 'invalidInput', category: 'validation', shouldRetry: false },
  malformed: { messageKey: 'malformed', category: 'validation', shouldRetry: false },
  'not found': { messageKey: 'notFound', category: 'validation', shouldRetry: false },

  // Provider/SDK errors
  'sdk not connected': {
    messageKey: 'sdkNotConnected',
    category: 'provider',
    shouldRetry: false,
  },
  'sdk initialization': {
    messageKey: 'sdkInitialization',
    category: 'provider',
    shouldRetry: true,
  },
  breez: { messageKey: 'provider', category: 'provider', shouldRetry: true },
  spark: { messageKey: 'provider', category: 'provider', shouldRetry: true },
  provider: { messageKey: 'provider', category: 'provider', shouldRetry: true },
  'service unavailable': {
    messageKey: 'serviceUnavailable',
    category: 'provider',
    shouldRetry: true,
  },
  'rate limit': { messageKey: 'rateLimit', category: 'provider', shouldRetry: true },

  // Lightning address errors
  'lightning address': {
    messageKey: 'invalidLightningAddress',
    category: 'validation',
    shouldRetry: false,
  },
  'address not available': {
    messageKey: 'lightningAddressTaken',
    category: 'validation',
    shouldRetry: false,
  },
  'address unavailable': {
    messageKey: 'lightningAddressTaken',
    category: 'validation',
    shouldRetry: false,
  },

  // Deposit/claim errors
  'fee too high': { messageKey: 'feeTooHigh', category: 'payment', shouldRetry: true },
  'claim failed': { messageKey: 'claimFailed', category: 'payment', shouldRetry: true },
};

/**
 * Caller-supplied contexts (`getBreezErrorMessage(err, '<context>')`) mapped
 * to full translated sentences (`hooks.breez.contexts.*`). English text is
 * `Failed to <context>. Please try again.`; unknown contexts fall back to the
 * generic `hooks.breez.unexpected` message.
 */
const CONTEXT_MESSAGES: Record<string, BreezContextKey> = {
  'create invoice': 'createInvoice',
  'prepare payment': 'preparePayment',
  'send payment': 'sendPayment',
  'fetch payment history': 'fetchPaymentHistory',
  'send zap': 'sendZap',
  'load Lightning address': 'loadLightningAddress',
  'check Lightning address availability': 'checkLightningAddressAvailability',
  'register Lightning address': 'registerLightningAddress',
  'delete Lightning address': 'deleteLightningAddress',
  'list contacts': 'listContacts',
  'add contact': 'addContact',
  'update contact': 'updateContact',
  'delete contact': 'deleteContact',
  'create wallet': 'createWallet',
  'restore wallet': 'restoreWallet',
  'unlock wallet': 'unlockWallet',
  'lock wallet': 'lockWallet',
  'refresh balance': 'refreshBalance',
  'connect to wallet': 'connectToWallet',
  'disconnect wallet': 'disconnectWallet',
  'fetch balance': 'fetchBalance',
  'generate payment method': 'generatePaymentMethod',
  'wait for payment': 'waitForPayment',
  'prepare send-all payment': 'prepareSendAllPayment',
  'parse input': 'parseInput',
  'prepare Lightning address payment': 'prepareLightningAddressPayment',
  'send Lightning address payment': 'sendLightningAddressPayment',
  'receive LNURL withdraw': 'receiveLnurlWithdraw',
  'fetch wallet info': 'fetchWalletInfo',
  'fetch Lightning address': 'fetchLightningAddress',
  'fetch unclaimed deposits': 'fetchUnclaimedDeposits',
  'claim deposit': 'claimDeposit',
  'refund deposit': 'refundDeposit',
  'start Cash App purchase': 'startCashAppPurchase',
  'parse payment input': 'parsePaymentInput',
  'prepare Bitcoin payment': 'prepareBitcoinPayment',
  'load incoming funds': 'loadIncomingFunds',
};

/**
 * Check if an error is from Breez/Spark SDK
 */
function isBreezSDKError(error: any): boolean {
  if (!error) return false;

  const errorString = error.toString().toLowerCase();
  const errorMessage = (error.message || '').toLowerCase();
  const errorName = (error.name || '').toLowerCase();

  // Check for Breez/Spark SDK indicators
  const sdkIndicators = [
    'breez',
    'spark',
    'lightning',
    'bolt11',
    'lnurl',
    'invoice',
    'payment',
    'channel',
    'node',
  ];

  return sdkIndicators.some(
    (indicator) =>
      errorString.includes(indicator) ||
      errorMessage.includes(indicator) ||
      errorName.includes(indicator)
  );
}

/**
 * Find the best matching error message from the dictionary
 */
function findErrorMatch(errorText: string): (typeof ERROR_MESSAGES)[string] | null {
  const lowerError = errorText.toLowerCase();

  // Try exact matches first
  for (const [pattern, info] of Object.entries(ERROR_MESSAGES)) {
    if (lowerError.includes(pattern.toLowerCase())) {
      return info;
    }
  }

  return null;
}

/**
 * Handle Breez SDK errors and return user-friendly messages
 *
 * @param error - The error object from Breez SDK
 * @param context - Optional context about where the error occurred (e.g., 'sending payment', 'creating invoice')
 * @returns BreezErrorInfo with user-friendly message and metadata
 */
export function handleBreezError(error: any, context?: string): BreezErrorInfo {
  // Extract error message
  const originalError = error?.message || error?.toString() || 'Unknown error';

  // Check if this is a Breez SDK error
  const isSdkError = isBreezSDKError(error);

  // Try to find a matching error pattern
  const match = findErrorMatch(originalError);

  if (match) {
    return {
      userMessage: translateHooks(`breez.${match.messageKey}`),
      originalError,
      shouldRetry: match.shouldRetry,
      category: match.category,
    };
  }

  // If it's a recognized SDK error but no specific match, use generic provider message
  if (isSdkError) {
    return {
      userMessage: translateHooks('breez.provider'),
      originalError,
      shouldRetry: true,
      category: 'provider',
    };
  }

  // For non-SDK errors, return a generic message
  return {
    userMessage:
      context && CONTEXT_MESSAGES[context]
        ? translateHooks(`breez.contexts.${CONTEXT_MESSAGES[context]}`)
        : translateHooks('breez.unexpected'),
    originalError,
    shouldRetry: true,
    category: 'unknown',
  };
}

/**
 * Get a user-friendly error message from a Breez SDK error
 * Convenience function that just returns the message string
 *
 * @param error - The error object from Breez SDK
 * @param context - Optional context about where the error occurred
 * @returns User-friendly error message string
 */
export function getBreezErrorMessage(error: any, context?: string): string {
  return handleBreezError(error, context).userMessage;
}

/**
 * Check if an error should trigger a retry suggestion
 */
export function shouldRetryBreezError(error: any): boolean {
  return handleBreezError(error).shouldRetry;
}

// Money-path redaction patterns: bolt11 invoices and BIP39-looking
// mnemonic sequences (12+ space-separated lowercase words) must never
// reach the console or error reporters in the clear.
const BOLT11_PATTERN = /lnbc[A-Za-z0-9]+/g;
const MNEMONIC_PATTERN = /\b(?:[a-z]{3,12} ){11,}[a-z]{3,12}\b/g;

/**
 * Recursively redact a logged value: replace bolt11 invoice strings and
 * mnemonic-looking word sequences in every string it contains.
 */
export function redactMoneyStrings(value: unknown, seen: Set<unknown> = new Set()): unknown {
  if (typeof value === 'string') {
    return value
      .replace(BOLT11_PATTERN, 'lnbc[redacted]')
      .replace(MNEMONIC_PATTERN, '[mnemonic redacted]');
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactMoneyStrings(item, seen));
  }

  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) {
      return '[circular]';
    }
    seen.add(value);

    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = redactMoneyStrings(item, seen);
    }
    return redacted;
  }

  return value;
}

/**
 * Log Breez SDK error with context (for debugging)
 * Logs only sanitized info; raw errors can embed invoices or seed words.
 */
export function logBreezError(error: unknown, context?: string): void {
  const errorInfo = handleBreezError(error, context);

  // Deliberately drops originalError and the full error object from the log:
  // raw SDK errors/payloads can embed invoices (lnbc…) or seed words.
  // Log only code/category/userMessage, with money strings redacted.
  const loggedInfo: Record<string, unknown> = {
    userMessage: errorInfo.userMessage,
    category: errorInfo.category,
    shouldRetry: errorInfo.shouldRetry,
  };

  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    loggedInfo.code = error.code;
  }

  logger.error(
    `[Breez SDK Error]${context ? ` (${context})` : ''}`,
    redactMoneyStrings(loggedInfo)
  );
}
