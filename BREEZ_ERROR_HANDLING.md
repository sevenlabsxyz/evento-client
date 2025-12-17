# Breez/Spark SDK Error Handling Implementation

## Overview

This document describes the implementation of graceful error handling for Spark/Breez SDK errors throughout the Evento wallet codebase. Instead of showing raw technical error messages to users, the system now provides user-friendly, actionable error messages with type-safe constant strings to prevent typos.

## What Was Changed

### 1. New Error Handler Utility (`lib/utils/breez-error-handler.ts`)

Created a centralized error handler that:

- **Uses constant strings** for all error contexts (prevents typos)
- **Detects Breez/Spark SDK errors** automatically
- **Maps error patterns** to user-friendly messages
- **Categorizes errors** (network, payment, balance, validation, provider, unknown)
- **Provides retry guidance** (whether the user should try again)
- **Logs detailed errors** for developers while showing friendly messages to users

#### Key Functions

```typescript
// Get user-friendly error message
getBreezErrorMessage(error, context?)

// Get full error information including category and retry guidance
handleBreezError(error, context?)

// Log error with context for debugging
logBreezError(error, context?)

// Check if error should trigger retry suggestion
shouldRetryBreezError(error)
```

#### Error Context Constants

All error contexts use the `BREEZ_ERROR_CONTEXT` constant object to prevent typos:

```typescript
import { BREEZ_ERROR_CONTEXT } from '@/lib/utils/breez-error-handler';

// SDK Connection
BREEZ_ERROR_CONTEXT.CONNECTING;
BREEZ_ERROR_CONTEXT.DISCONNECTING;

// Wallet Operations
BREEZ_ERROR_CONTEXT.CREATING_WALLET;
BREEZ_ERROR_CONTEXT.RESTORING_WALLET;
BREEZ_ERROR_CONTEXT.RESTORING_FROM_MNEMONIC;
BREEZ_ERROR_CONTEXT.UNLOCKING_WALLET;
BREEZ_ERROR_CONTEXT.LOCKING_WALLET;
BREEZ_ERROR_CONTEXT.INITIALIZING_WALLET;
BREEZ_ERROR_CONTEXT.AUTO_CONNECTING_WALLET;

// Balance Operations
BREEZ_ERROR_CONTEXT.FETCHING_BALANCE;
BREEZ_ERROR_CONTEXT.REFRESHING_BALANCE;

// Invoice Operations
BREEZ_ERROR_CONTEXT.CREATING_INVOICE;

// Payment Operations
BREEZ_ERROR_CONTEXT.RECEIVING_PAYMENT;
BREEZ_ERROR_CONTEXT.PREPARING_PAYMENT;
BREEZ_ERROR_CONTEXT.PREPARING_SEND_PAYMENT;
BREEZ_ERROR_CONTEXT.SENDING_PAYMENT;
BREEZ_ERROR_CONTEXT.SENDING_PAYMENT_WITH_OPTIONS;
BREEZ_ERROR_CONTEXT.WAITING_FOR_PAYMENT;
BREEZ_ERROR_CONTEXT.PARSING_INPUT;
BREEZ_ERROR_CONTEXT.PARSING_PAYMENT_INPUT;

// LNURL Operations
BREEZ_ERROR_CONTEXT.PREPARING_LNURL_PAYMENT;
BREEZ_ERROR_CONTEXT.EXECUTING_LNURL_PAYMENT;

// Payment History
BREEZ_ERROR_CONTEXT.LISTING_PAYMENTS;
BREEZ_ERROR_CONTEXT.FETCHING_PAYMENT_HISTORY;

// Node Info
BREEZ_ERROR_CONTEXT.FETCHING_NODE_INFO;

// Lightning Address Operations
BREEZ_ERROR_CONTEXT.CHECKING_LIGHTNING_ADDRESS_AVAILABILITY;
BREEZ_ERROR_CONTEXT.REGISTERING_LIGHTNING_ADDRESS;
BREEZ_ERROR_CONTEXT.LOADING_LIGHTNING_ADDRESS;
BREEZ_ERROR_CONTEXT.FETCHING_LIGHTNING_ADDRESS;
BREEZ_ERROR_CONTEXT.DELETING_LIGHTNING_ADDRESS;

// Deposit Operations
BREEZ_ERROR_CONTEXT.LISTING_UNCLAIMED_DEPOSITS;
BREEZ_ERROR_CONTEXT.CLAIMING_DEPOSIT;
BREEZ_ERROR_CONTEXT.REFUNDING_DEPOSIT;

// Zap Operations
BREEZ_ERROR_CONTEXT.SENDING_ZAP;
```

**Benefits of using constants:**

- **Type safety**: TypeScript will catch typos at compile time
- **Autocomplete**: IDE will suggest available contexts
- **Consistency**: Ensures the same context string is used everywhere
- **Refactoring**: Easy to update all usages by changing the constant value

#### Error Message Dictionary

The handler includes mappings for common error scenarios:

**Network Errors:**

- Connection issues → "Network connection issue. Please check your internet and try again."
- Timeouts → "Request timed out. Please try again."
- Offline → "You appear to be offline. Please check your internet connection."

**Payment Errors:**

- Insufficient balance → "Insufficient balance to complete this payment."
- Expired invoice → "This invoice has expired. Please request a new one."
- Already paid → "This invoice has already been paid."
- No route → "Unable to find a payment route. The recipient may be offline or unreachable."
- Amount issues → "Payment amount is outside the acceptable range."

**Validation Errors:**

- Invalid input → "Invalid input. Please check your entry and try again."
- Malformed data → "Invalid format. Please check your entry and try again."

**Provider Errors:**

- SDK not connected → "Wallet not connected. Please unlock your wallet and try again."
- Generic provider errors → "Our payment provider reported an error. Please try again later."
- Rate limiting → "Too many requests. Please wait a moment and try again."

**Lightning Address Errors:**

- Invalid address → "Invalid Lightning address. Please check the address and try again."
- Address taken → "This Lightning address is already taken. Please choose a different one."

**Deposit/Claim Errors:**

- High fees → "Transaction fee is too high. Please try again later when fees are lower."
- Claim failed → "Failed to claim deposit. Please try again or contact support."

### 2. Updated Files

#### Core SDK Service

- **`lib/services/breez-sdk.ts`**
    - All 23 catch blocks updated to use `BREEZ_ERROR_CONTEXT` constants
    - Errors now include typed context (e.g., `BREEZ_ERROR_CONTEXT.SENDING_PAYMENT`)
    - User-friendly messages thrown instead of raw SDK errors

#### Wallet Hooks

- **`lib/hooks/use-wallet.ts`**
    - Updated 10 error handlers to use constants
    - Covers: wallet creation, restoration, unlocking, locking, balance refresh
- **`lib/hooks/use-wallet-payments.ts`**
    - Updated 5 error handlers to use constants
    - Covers: invoice creation, payment preparation, sending payments, payment history, zaps

- **`lib/hooks/use-lightning-address.ts`**
    - Updated 4 error handlers to use constants
    - Covers: loading, checking availability, registering, deleting Lightning addresses

#### Wallet Components

- **`components/wallet/send-lightning-sheet.tsx`**
    - Updated payment input parsing to use constants
- **`components/wallet/incoming-funds-sheet.tsx`**
    - Updated deposit loading to use constants

## Benefits

### For Users

1. **Clear, actionable messages** instead of technical jargon
2. **Guidance on what to do next** (retry, check input, wait, etc.)
3. **Consistent experience** across all wallet operations
4. **Less frustration** when errors occur

### For Developers

1. **Type-safe error contexts** prevent typos
2. **IDE autocomplete** for available contexts
3. **Detailed error logs** preserved in console for debugging
4. **Centralized error handling** - easy to update messages
5. **Error categorization** helps identify patterns
6. **Context tracking** shows where errors occurred

## Usage Examples

### Before

```typescript
catch (error) {
  console.error('Failed to send payment:', error);
  toast.error(error.message || 'Failed to send payment');
  throw error;
}
```

### After

```typescript
import { logBreezError, getBreezErrorMessage, BREEZ_ERROR_CONTEXT } from '@/lib/utils/breez-error-handler';

catch (error) {
  logBreezError(error, BREEZ_ERROR_CONTEXT.SENDING_PAYMENT);
  const userMessage = getBreezErrorMessage(error, 'send payment');
  toast.error(userMessage);
  throw new Error(userMessage);
}
```

## Error Flow

```
User Action
    ↓
SDK Operation (e.g., breezSDK.sendPayment())
    ↓
Error Occurs
    ↓
logBreezError(error, BREEZ_ERROR_CONTEXT.SENDING_PAYMENT)
    ↓
Logs detailed error for developers
    ↓
getBreezErrorMessage(error, 'send payment')
    ↓
Generates user-friendly message
    ↓
toast.error(userMessage)
    ↓
Shows message to user
    ↓
Error thrown with friendly message
```

## Testing Recommendations

To verify the implementation works correctly, test these scenarios:

### Network Errors

- Disconnect internet and try to send payment
- Expected: "Network connection issue. Please check your internet and try again."

### Payment Errors

- Try to send more sats than available balance
- Expected: "Insufficient balance to complete this payment."

- Try to pay an expired invoice
- Expected: "This invoice has expired. Please request a new one."

### Validation Errors

- Enter invalid Lightning address format
- Expected: "Invalid input. Please check your entry and try again."

### Provider Errors

- Try to use wallet features when locked
- Expected: "Wallet not connected. Please unlock your wallet and try again."

## Future Enhancements

1. **Add more specific error patterns** as they're discovered in production
2. **Internationalization (i18n)** - translate error messages
3. **Error analytics** - track which errors occur most frequently
4. **Contextual help links** - link to documentation for specific errors
5. **Retry mechanisms** - automatic retry for transient errors
6. **Add more constants** as new operations are added

## Maintenance

### Adding New Error Context Constants

To add a new error context constant:

1. Open `lib/utils/breez-error-handler.ts`
2. Add entry to `BREEZ_ERROR_CONTEXT` object:

```typescript
export const BREEZ_ERROR_CONTEXT = {
    // ... existing constants
    YOUR_NEW_OPERATION: 'your operation description',
} as const;
```

3. Use the constant in your error handling:

```typescript
catch (error) {
  logBreezError(error, BREEZ_ERROR_CONTEXT.YOUR_NEW_OPERATION);
  const userMessage = getBreezErrorMessage(error, 'your operation');
  toast.error(userMessage);
  throw new Error(userMessage);
}
```

### Adding New Error Messages

To add a new error message pattern:

1. Open `lib/utils/breez-error-handler.ts`
2. Add entry to `ERROR_MESSAGES` dictionary:

```typescript
'your error pattern': {
  message: 'User-friendly message here',
  category: 'payment', // or 'network', 'validation', etc.
  shouldRetry: true, // or false
}
```

3. The pattern will automatically be matched against error messages (case-insensitive)

### Updating Existing Messages

Simply edit the `message` field in the `ERROR_MESSAGES` dictionary. Changes will apply across the entire application.

## Notes

- Error contexts use **constant strings** to prevent typos
- Error messages are **case-insensitive** for matching
- The handler uses **pattern matching** (substring search) for flexibility
- **Default fallback** message is provided for unknown errors
- **Original errors** are always logged for debugging
- The system is **backward compatible** - non-SDK errors still work normally

## Related Files

- `lib/utils/breez-error-handler.ts` - Core error handler with constants
- `lib/services/breez-sdk.ts` - SDK service with error handling
- `lib/hooks/use-wallet.ts` - Wallet operations
- `lib/hooks/use-wallet-payments.ts` - Payment operations
- `lib/hooks/use-lightning-address.ts` - Lightning address operations
- `components/wallet/send-lightning-sheet.tsx` - Send payment UI
- `components/wallet/incoming-funds-sheet.tsx` - Incoming funds UI
