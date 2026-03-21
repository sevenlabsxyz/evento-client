/**
 * Passkey Service for WebAuthn PRF Operations
 *
 * Provides WebAuthn passkey creation and authentication with PRF (Pseudo-Random Function)
 * extension support. PRF enables deterministic key derivation from passkeys for
 * wallet recovery without storing additional secrets.
 *
 * Browser Support:
 * - Chrome 130+: Full PRF support
 * - Firefox 139+: Full PRF support
 * - Safari 18.2+: Full PRF support (macOS only)
 * - Windows Hello: No PRF support
 *
 * @example
 * ```typescript
 * // Create a new passkey with PRF extension
 * const credential = await createPasskey('evento.app');
 *
 * // Authenticate and evaluate PRF to derive wallet key
 * const salt = crypto.randomUUID(); // Unique salt per wallet
 * const prfOutput = await authenticateWithPRF('evento.app', salt);
 *
 * // Convert PRF output to mnemonic
 * const mnemonic = prfOutputToMnemonic(prfOutput);
 * ```
 */

import { logger } from '@/lib/utils/logger';
import { checkPRFSupport, type PRFSupportResult } from '@/lib/utils/webauthn-capabilities';
import { prfOutputToMnemonic } from './prf-to-mnemonic';
// Re-export PRFSupportResult for consumers
export type { PRFSupportResult } from '@/lib/utils/webauthn-capabilities';

// Debug flag for verbose logging
const DEBUG_PASSKEY = false;

/**
 * Marker for PRF-derived wallets (fresh setup)
 * Stored as the "encrypted mnemonic" to indicate mnemonic should be derived from PRF
 */
export const PRF_DERIVED_MARKER = 'prf-derived';

/**
 * Marker prefix for PRF-encrypted mnemonics (migrated wallets)
 * Actual encrypted data follows this prefix
 */
export const PRF_ENCRYPTED_PREFIX = 'prf-enc:';
/**
 * Custom error types for passkey operations
 */
export class PasskeyError extends Error {
  constructor(
    message: string,
    public readonly code: PasskeyErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PasskeyError';
  }
}

export type PasskeyErrorCode =
  | 'not_supported'
  | 'cancelled'
  | 'failed'
  | 'prf_not_supported'
  | 'prf_evaluation_failed'
  | 'invalid_credential'
  | 'no_credentials_found';

/**
 * Result of passkey credential creation
 */
export interface PasskeyCredential {
  /** Base64URL-encoded credential ID */
  id: string;
  /** Raw credential ID as Uint8Array */
  rawId: Uint8Array;
  /** Attestation object (for verification) */
  attestationObject: Uint8Array;
  /** Client data JSON */
  clientDataJSON: Uint8Array;
  /** PRF salts used during creation */
  prfSalts?: {
    first: Uint8Array;
    second?: Uint8Array;
  };
  /** Whether PRF extension was enabled */
  prfEnabled: boolean;
}

/**
 * Options for passkey creation
 */
export interface CreatePasskeyOptions {
  /** User display name (shown in browser UI) */
  userDisplayName?: string;
  /** User identifier (unique per user) */
  userId?: string;
  /** Challenge for attestation (auto-generated if not provided) */
  challenge?: Uint8Array;
  /** Whether to require user verification */
  requireUserVerification?: boolean;
  /** Authenticator type preference */
  authenticatorType?: 'platform' | 'cross-platform' | 'auto';
}

/**
 * Options for PRF authentication
 */
export interface AuthenticateWithPRFOptions {
  /** Specific credential ID to use (optional, uses any matching credential if not provided) */
  credentialId?: string;
  /** Whether to require user verification */
  requireUserVerification?: boolean;
}

/**
 * Result of PRF authentication
 */
export interface PRFAuthenticationResult {
  /** PRF output (32 bytes) */
  prfOutput: Uint8Array;
  /** Credential ID used */
  credentialId: string;
  /** Whether user verification was performed */
  userVerified: boolean;
}

/**
 * Check if PRF is supported in the current browser
 * Wrapper around webauthn-capabilities checkPRFSupport
 */
export async function checkPasskeyPRFSupport(): Promise<PRFSupportResult> {
  return checkPRFSupport();
}

/**
 * Generate a random challenge for WebAuthn operations
 */
function generateChallenge(): Uint8Array {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge;
}

/**
 * Generate a random user ID for credential creation
 */
function generateUserId(): Uint8Array {
  const userId = new Uint8Array(32);
  crypto.getRandomValues(userId);
  return userId;
}

/**
 * Convert string to Uint8Array (UTF-8 encoded)
 */
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to Base64URL string
 */
function uint8ArrayToBase64URL(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert Base64URL string to Uint8Array
 */
function base64URLToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * Create a new passkey credential with PRF extension
 *
 * Creates a WebAuthn credential that supports the PRF extension.
 * The PRF extension allows deriving deterministic keys from the passkey.
 *
 * @param rpId - Relying Party ID (typically the domain)
 * @param options - Additional options for credential creation
 * @returns Created passkey credential with PRF capability info
 * @throws PasskeyError if creation fails or is cancelled
 */
export async function createPasskey(
  rpId: string,
  options: CreatePasskeyOptions = {}
): Promise<PasskeyCredential> {
  const {
    userDisplayName = 'Evento Wallet',
    userId,
    challenge,
    requireUserVerification = true,
    authenticatorType = 'auto',
  } = options;

  if (DEBUG_PASSKEY) {
    logger.debug('Creating passkey', { rpId, userDisplayName, authenticatorType });
  }

  // Check PRF support first
  const prfSupport = await checkPRFSupport();
  if (!prfSupport.supported) {
    throw new PasskeyError(
      prfSupport.reason || 'PRF extension is not supported in this browser',
      'prf_not_supported'
    );
  }

  // Check if WebAuthn is available
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new PasskeyError(
      'WebAuthn is not available in this browser',
      'not_supported'
    );
  }

  try {
    // Generate challenge and user ID if not provided
    const challengeBytes = challenge || generateChallenge();
    const userIdBytes = userId ? stringToUint8Array(userId) : generateUserId();

    // Generate PRF salts
    const prfFirstSalt = generateChallenge(); // 32 bytes
    const prfSecondSalt = generateChallenge(); // 32 bytes

    // Build authenticator selection
    const authenticatorSelection: AuthenticatorSelectionCriteria = {
      authenticatorAttachment:
        authenticatorType === 'platform'
          ? 'platform'
          : authenticatorType === 'cross-platform'
            ? 'cross-platform'
            : undefined,
      userVerification: requireUserVerification ? 'required' : 'preferred',
      residentKey: 'required',
    };

    // Build credential creation options
    const createOptions: PublicKeyCredentialCreationOptions = {
      rp: {
        id: rpId,
        name: 'Evento',
      },
      user: {
        id: userIdBytes,
        name: userDisplayName,
        displayName: userDisplayName,
      },
      challenge: challengeBytes,
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection,
      timeout: 60000, // 60 seconds
      attestation: 'direct',
      extensions: {
        prf: {
          eval: {
            first: prfFirstSalt,
            second: prfSecondSalt,
          },
        },
      },
    };

    if (DEBUG_PASSKEY) {
      logger.debug('WebAuthn create options', {
        rpId,
        userVerification: authenticatorSelection.userVerification,
        hasPRFExtension: true,
      });
    }

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: createOptions,
    });

    if (!credential) {
      throw new PasskeyError('Passkey creation returned no credential', 'failed');
    }

    const pkCredential = credential as PublicKeyCredential;
    const response = pkCredential.response as AuthenticatorAttestationResponse;

    // Check if PRF was actually enabled
    let prfEnabled = false;
    let prfSalts: { first: Uint8Array; second?: Uint8Array } | undefined;

    // Get PRF extension results
    const clientExtensionResults = pkCredential.getClientExtensionResults();
    if (clientExtensionResults.prf?.enabled) {
      prfEnabled = true;
      prfSalts = {
        first: prfFirstSalt,
        second: prfSecondSalt,
      };
    }

    if (DEBUG_PASSKEY) {
      logger.debug('Passkey created successfully', {
        credentialId: uint8ArrayToBase64URL(new Uint8Array(pkCredential.rawId)),
        prfEnabled,
      });
    }

    return {
      id: pkCredential.id,
      rawId: new Uint8Array(pkCredential.rawId),
      attestationObject: new Uint8Array(response.attestationObject),
      clientDataJSON: new Uint8Array(response.clientDataJSON),
      prfSalts,
      prfEnabled,
    };
  } catch (error) {
    // Handle specific WebAuthn errors
    if (error instanceof Error) {
      // User cancelled the operation
      if (error.name === 'NotAllowedError') {
        throw new PasskeyError(
          'Passkey creation was cancelled',
          'cancelled',
          error
        );
      }

      // Not supported error
      if (error.name === 'NotSupportedError') {
        throw new PasskeyError(
          'Passkey creation is not supported on this device',
          'not_supported',
          error
        );
      }

      // Invalid state
      if (error.name === 'InvalidStateError') {
        throw new PasskeyError(
          'A passkey already exists for this account',
          'failed',
          error
        );
      }

      // Re-throw PasskeyError
      if (error instanceof PasskeyError) {
        throw error;
      }

      // Generic error
      throw new PasskeyError(
        `Failed to create passkey: ${error.message}`,
        'failed',
        error
      );
    }

    throw new PasskeyError('Failed to create passkey', 'failed');
  }
}

/**
 * Authenticate with a passkey and evaluate PRF
 *
 * Authenticates using an existing passkey and evaluates the PRF extension
 * to derive a deterministic key. The same salt will always produce the same
 * PRF output for the same credential.
 *
 * @param rpId - Relying Party ID (domain)
 * @param salt - Salt for PRF evaluation (string or Uint8Array)
 * @param options - Additional authentication options
 * @returns PRF output and credential info
 * @throws PasskeyError if authentication fails or PRF evaluation fails
 */
export async function authenticateWithPRF(
  rpId: string,
  salt: string | Uint8Array,
  options: AuthenticateWithPRFOptions = {}
): Promise<PRFAuthenticationResult> {
  const { credentialId, requireUserVerification = true } = options;

  if (DEBUG_PASSKEY) {
    logger.debug('Authenticating with PRF', {
      rpId,
      hasCredentialId: !!credentialId,
      saltType: typeof salt,
    });
  }

  // Check PRF support first
  const prfSupport = await checkPRFSupport();
  if (!prfSupport.supported) {
    throw new PasskeyError(
      prfSupport.reason || 'PRF extension is not supported in this browser',
      'prf_not_supported'
    );
  }

  // Check if WebAuthn is available
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new PasskeyError(
      'WebAuthn is not available in this browser',
      'not_supported'
    );
  }

  try {
    // Convert salt to Uint8Array if needed
    const saltBytes = typeof salt === 'string' ? stringToUint8Array(salt) : salt;

    // Normalize salt to exactly 32 bytes using SHA-256 for non-32-byte inputs
    // This ensures deterministic behavior regardless of input salt length
    let normalizedSalt: Uint8Array;
    if (saltBytes.length === 32) {
      normalizedSalt = saltBytes;
    } else {
      // Hash non-32-byte salts to get deterministic 32-byte output
      const hashBuffer = await crypto.subtle.digest('SHA-256', saltBytes);
      normalizedSalt = new Uint8Array(hashBuffer);
    }

    // Generate challenge
    const challenge = generateChallenge();

    // Build allow credentials if specific credential ID provided
    const allowCredentials: PublicKeyCredentialDescriptor[] = credentialId
      ? [
          {
            type: 'public-key',
            id: base64URLToUint8Array(credentialId),
          },
        ]
      : [];

    // Build credential request options
    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: requireUserVerification ? 'required' : 'preferred',
      timeout: 60000, // 60 seconds
      extensions: {
        prf: {
          eval: {
            first: normalizedSalt,
          },
        },
      },
    };

    if (DEBUG_PASSKEY) {
      logger.debug('WebAuthn get options', {
        rpId,
        hasAllowCredentials: allowCredentials.length > 0,
        userVerification: requestOptions.userVerification,
      });
    }

    // Get credential
    const credential = await navigator.credentials.get({
      publicKey: requestOptions,
    });

    if (!credential) {
      throw new PasskeyError('No passkey found', 'no_credentials_found');
    }

    const pkCredential = credential as PublicKeyCredential;

    // Get PRF extension results
    const clientExtensionResults = pkCredential.getClientExtensionResults();

    if (!clientExtensionResults.prf?.results?.first) {
      throw new PasskeyError(
        'PRF evaluation failed - no result returned',
        'prf_evaluation_failed'
      );
    }

    const prfOutput = new Uint8Array(clientExtensionResults.prf.results.first as ArrayBuffer);

    if (DEBUG_PASSKEY) {
      logger.debug('PRF authentication successful', {
        credentialId: pkCredential.id,
        prfOutputLength: prfOutput.length,
        userVerified: (pkCredential.response as AuthenticatorAssertionResponse).userHandle !== null,
      });
    }

    return {
      prfOutput,
      credentialId: pkCredential.id,
      userVerified: (pkCredential.response as AuthenticatorAssertionResponse).userHandle !== null,
    };
  } catch (error) {
    // Handle specific WebAuthn errors
    if (error instanceof Error) {
      // User cancelled the operation
      if (error.name === 'NotAllowedError') {
        throw new PasskeyError(
          'Passkey authentication was cancelled',
          'cancelled',
          error
        );
      }

      // No credentials found
      if (error.name === 'NotFoundError') {
        throw new PasskeyError(
          'No passkey found for this account',
          'no_credentials_found',
          error
        );
      }

      // Re-throw PasskeyError
      if (error instanceof PasskeyError) {
        throw error;
      }

      // Generic error
      throw new PasskeyError(
        `Failed to authenticate with passkey: ${error.message}`,
        'failed',
        error
      );
    }

    throw new PasskeyError('Failed to authenticate with passkey', 'failed');
  }
}

/**
 * Authenticate with PRF and derive mnemonic
 *
 * Convenience function that combines authenticateWithPRF and prfOutputToMnemonic.
 *
 * @param rpId - Relying Party ID (domain)
 * @param salt - Salt for PRF evaluation
 * @param options - Additional authentication options
 * @returns Mnemonic phrase and credential info
 */
export async function authenticateAndDeriveMnemonic(
  rpId: string,
  salt: string | Uint8Array,
  options: AuthenticateWithPRFOptions = {}
): Promise<{ mnemonic: string; credentialId: string; userVerified: boolean }> {
  const result = await authenticateWithPRF(rpId, salt, options);
  const mnemonic = prfOutputToMnemonic(result.prfOutput);

  return {
    mnemonic,
    credentialId: result.credentialId,
    userVerified: result.userVerified,
  };
}

/**
 * Check if a passkey exists for the given RP ID
 *
 * Note: This only checks if WebAuthn is available and PRF is supported.
 * Actual credential existence requires user interaction.
 */
export async function checkPasskeyAvailable(): Promise<{
  available: boolean;
  prfSupported: boolean;
  reason?: string;
}> {
  const prfSupport = await checkPRFSupport();

  if (!prfSupport.supported) {
    return {
      available: false,
      prfSupported: false,
      reason: prfSupport.reason,
    };
  }

  // Check if WebAuthn is available
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      available: false,
      prfSupported: false,
      reason: 'WebAuthn is not available',
    };
  }

  // Check if platform authenticator is available
  try {
    const platformAuthAvailable =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();

    return {
      available: platformAuthAvailable ?? false,
      prfSupported: true,
    };
  } catch {
    return {
      available: false,
      prfSupported: true,
      reason: 'Could not check platform authenticator availability',
    };
  }
}

/**
 * Generate a new salt for PRF evaluation
 *
 * Returns a UUID v4 string suitable for use as a PRF salt.
 * Each wallet should use a unique salt.
 */
export function generatePRFSalt(): string {
  return crypto.randomUUID();
}

/**
 * Check if an error is a PasskeyError
 */
export function isPasskeyError(error: unknown): error is PasskeyError {
  return error instanceof PasskeyError;
}

/**
 * Get user-friendly error message for a passkey error
 */
export function getPasskeyErrorMessage(error: PasskeyError): string {
  switch (error.code) {
    case 'not_supported':
      return 'Passkeys are not supported on this device or browser.';

    case 'cancelled':
      return 'The passkey operation was cancelled.';

    case 'prf_not_supported':
      return 'Your browser does not support the PRF extension required for passkey-based wallet recovery.';

    case 'prf_evaluation_failed':
      return 'Failed to derive wallet key from passkey. Please try again.';

    case 'no_credentials_found':
      return 'No passkey found. Please create a passkey first.';

    case 'invalid_credential':
      return 'The passkey is invalid or has been revoked.';

    case 'failed':
    default:
      return error.message || 'An unexpected error occurred with the passkey operation.';
  }
}

// ============================================================
// PRF-based Encryption/Decryption for Migrated Wallets
// ============================================================

/**
 * Derive an AES-GCM key from PRF output
 *
 * PRF output is 32 bytes - we use HKDF-like approach to derive a proper key.
 * For simplicity, we use the PRF output directly as key material.
 */
async function deriveAESKeyFromPRF(prfOutput: Uint8Array): Promise<CryptoKey> {
  // Import PRF output as raw key material
  return crypto.subtle.importKey(
    'raw',
    prfOutput,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a mnemonic using PRF output as the encryption key
 *
 * Used during migration to encrypt the existing wallet mnemonic
 * with the PRF output, enabling recovery via passkey authentication.
 *
 * @param mnemonic - The mnemonic to encrypt
 * @param prfOutput - The PRF output to use as encryption key
 * @returns Encrypted data with prefix marker
 */
export async function encryptMnemonicWithPRF(
  mnemonic: string,
  prfOutput: Uint8Array
): Promise<string> {
  const key = await deriveAESKeyFromPRF(prfOutput);

  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the mnemonic
  const encoder = new TextEncoder();
  const mnemonicBytes = encoder.encode(mnemonic);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    mnemonicBytes
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...combined));

  // Return with prefix marker
  return `${PRF_ENCRYPTED_PREFIX}${base64}`;
}

/**
 * Decrypt a mnemonic using PRF output as the decryption key
 *
 * Used during restore/export to decrypt migrated wallet mnemonics.
 *
 * @param encryptedData - The encrypted data (with prefix marker)
 * @param prfOutput - The PRF output to use as decryption key
 * @returns The decrypted mnemonic
 * @throws Error if decryption fails or data is malformed
 */
export async function decryptMnemonicWithPRF(
  encryptedData: string,
  prfOutput: Uint8Array
): Promise<string> {
  // Verify prefix
  if (!encryptedData.startsWith(PRF_ENCRYPTED_PREFIX)) {
    throw new Error('Invalid encrypted data format - missing prefix');
  }

  // Extract base64 data
  const base64Data = encryptedData.slice(PRF_ENCRYPTED_PREFIX.length);

  // Decode from base64
  const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  // Extract IV (first 12 bytes) and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedBytes = combined.slice(12);

  // Derive key and decrypt
  const key = await deriveAESKeyFromPRF(prfOutput);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBytes
  );

  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Check if stored wallet data represents a PRF-derived wallet (fresh setup)
 *
 * @param storedData - The data stored as "encrypted mnemonic"
 * @returns true if this is a PRF-derived wallet (mnemonic should be derived from PRF)
 */
export function isPRFDerivedWallet(storedData: string): boolean {
  return storedData === PRF_DERIVED_MARKER;
}

/**
 * Check if stored wallet data represents a migrated wallet (encrypted mnemonic)
 *
 * @param storedData - The data stored as "encrypted mnemonic"
 * @returns true if this is a migrated wallet (mnemonic should be decrypted)
 */
export function isPRFEncryptedWallet(storedData: string): boolean {
  return storedData.startsWith(PRF_ENCRYPTED_PREFIX);
}