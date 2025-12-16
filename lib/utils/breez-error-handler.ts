export interface BreezErrorInfo {
  userMessage: string;
  originalError: string;
  shouldRetry: boolean;
  category: 'network' | 'payment' | 'balance' | 'validation' | 'provider' | 'unknown';
}

/**
 * Error message dictionary for common Breez SDK errors
 * Maps error patterns to user-friendly messages
 */
const ERROR_MESSAGES: Record<
  string,
  {
    message: string;
    category: BreezErrorInfo['category'];
    shouldRetry: boolean;
  }
> = {
  // Network/Connection errors
  network: {
    message: 'Network connection issue. Please check your internet and try again.',
    category: 'network',
    shouldRetry: true,
  },
  timeout: {
    message: 'Request timed out. Please try again.',
    category: 'network',
    shouldRetry: true,
  },
  connection: {
    message: 'Unable to connect to the Lightning network. Please try again later.',
    category: 'network',
    shouldRetry: true,
  },
  offline: {
    message: 'You appear to be offline. Please check your internet connection.',
    category: 'network',
    shouldRetry: true,
  },

  // Payment errors
  insufficient: {
    message: 'Insufficient balance to complete this payment.',
    category: 'balance',
    shouldRetry: false,
  },
  'invoice expired': {
    message: 'This invoice has expired. Please request a new one.',
    category: 'payment',
    shouldRetry: false,
  },
  'invoice already paid': {
    message: 'This invoice has already been paid.',
    category: 'payment',
    shouldRetry: false,
  },
  'payment failed': {
    message: 'Payment failed. Please try again or contact support if the issue persists.',
    category: 'payment',
    shouldRetry: true,
  },
  'no route': {
    message: 'Unable to find a payment route. The recipient may be offline or unreachable.',
    category: 'payment',
    shouldRetry: true,
  },
  'route not found': {
    message: 'Unable to find a payment route. Please try again later.',
    category: 'payment',
    shouldRetry: true,
  },
  'amount too low': {
    message: 'Payment amount is too low. Please increase the amount.',
    category: 'validation',
    shouldRetry: false,
  },
  'amount too high': {
    message: 'Payment amount exceeds the maximum allowed. Please reduce the amount.',
    category: 'validation',
    shouldRetry: false,
  },
  'amount out of range': {
    message: 'Payment amount is outside the acceptable range.',
    category: 'validation',
    shouldRetry: false,
  },

  // Validation errors
  invalid: {
    message: 'Invalid input. Please check your entry and try again.',
    category: 'validation',
    shouldRetry: false,
  },
  malformed: {
    message: 'Invalid format. Please check your entry and try again.',
    category: 'validation',
    shouldRetry: false,
  },
  'not found': {
    message: 'Resource not found. Please verify the information and try again.',
    category: 'validation',
    shouldRetry: false,
  },

  // Provider/SDK errors
  'sdk not connected': {
    message: 'Wallet not connected. Please unlock your wallet and try again.',
    category: 'provider',
    shouldRetry: false,
  },
  'sdk initialization': {
    message: 'Wallet initialization failed. Please refresh the page and try again.',
    category: 'provider',
    shouldRetry: true,
  },
  breez: {
    message: 'Our payment provider reported an error. Please try again later.',
    category: 'provider',
    shouldRetry: true,
  },
  spark: {
    message: 'Our payment provider reported an error. Please try again later.',
    category: 'provider',
    shouldRetry: true,
  },
  provider: {
    message: 'Our payment provider reported an error. Please try again later.',
    category: 'provider',
    shouldRetry: true,
  },
  'service unavailable': {
    message: 'Service temporarily unavailable. Please try again in a few moments.',
    category: 'provider',
    shouldRetry: true,
  },
  'rate limit': {
    message: 'Too many requests. Please wait a moment and try again.',
    category: 'provider',
    shouldRetry: true,
  },

  // Lightning address errors
  'lightning address': {
    message: 'Invalid Lightning address. Please check the address and try again.',
    category: 'validation',
    shouldRetry: false,
  },
  'address not available': {
    message: 'This Lightning address is already taken. Please choose a different one.',
    category: 'validation',
    shouldRetry: false,
  },
  'address unavailable': {
    message: 'This Lightning address is already taken. Please choose a different one.',
    category: 'validation',
    shouldRetry: false,
  },

  // Deposit/claim errors
  'fee too high': {
    message: 'Transaction fee is too high. Please try again later when fees are lower.',
    category: 'payment',
    shouldRetry: true,
  },
  'claim failed': {
    message: 'Failed to claim deposit. Please try again or contact support.',
    category: 'payment',
    shouldRetry: true,
  },
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
      userMessage: match.message,
      originalError,
      shouldRetry: match.shouldRetry,
      category: match.category,
    };
  }

  // If it's a recognized SDK error but no specific match, use generic provider message
  if (isSdkError) {
    return {
      userMessage: 'Our payment provider reported an error. Please try again later.',
      originalError,
      shouldRetry: true,
      category: 'provider',
    };
  }

  // For non-SDK errors, return a generic message
  return {
    userMessage: context
      ? `Failed to ${context}. Please try again.`
      : 'An unexpected error occurred. Please try again.',
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

/**
 * Log Breez SDK error with context (for debugging)
 * This preserves the original error for developers while showing friendly messages to users
 */
export function logBreezError(error: any, context?: string): void {
  const errorInfo = handleBreezError(error, context);

  console.error(`[Breez SDK Error]${context ? ` (${context})` : ''}`, {
    userMessage: errorInfo.userMessage,
    originalError: errorInfo.originalError,
    category: errorInfo.category,
    shouldRetry: errorInfo.shouldRetry,
    fullError: error,
  });
}
