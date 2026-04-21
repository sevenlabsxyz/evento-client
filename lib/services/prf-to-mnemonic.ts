import * as bip39 from 'bip39';
import { logger } from '@/lib/utils/logger';

/**
 * PRF to Mnemonic Service
 *
 * Converts PRF (Pseudo-Random Function) output from WebAuthn/Passkey
 * into a valid BIP39 mnemonic phrase using direct entropy derivation.
 *
 * PRF output (32 bytes) is used directly as entropy for BIP39 mnemonic generation.
 * This provides deterministic key derivation - same PRF input always produces same mnemonic.
 *
 * @example
 * ```typescript
 * // From WebAuthn PRF extension result
 * const prfOutput = new Uint8Array(32); // 32 bytes from PRF
 * const mnemonic = prfOutputToMnemonic(prfOutput);
 * // Returns: 12-word BIP39 mnemonic
 * ```
 */

/**
 * Convert PRF output (32 bytes) to BIP39 mnemonic
 *
 * Uses the PRF output directly as entropy for BIP39 mnemonic generation.
 * 32 bytes (256 bits) of entropy produces a 24-word mnemonic.
 * For 12-word mnemonic, only the first 16 bytes (128 bits) are used.
 *
 * @param prfOutput - 32-byte Uint8Array from WebAuthn PRF extension
 * @returns 12-word BIP39 mnemonic phrase
 * @throws Error if PRF output is not exactly 32 bytes
 */
export function prfOutputToMnemonic(prfOutput: Uint8Array): string {
  try {
    // Validate PRF output length
    if (prfOutput.length !== 32) {
      throw new Error(`PRF output must be exactly 32 bytes, got ${prfOutput.length}`);
    }

    // Use first 16 bytes (128 bits) for 12-word mnemonic
    // This matches standard BIP39 entropy requirements:
    // 128 bits -> 12 words, 256 bits -> 24 words
    const entropy = prfOutput.slice(0, 16);

    // Convert to BIP39 mnemonic using direct entropy
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

    logger.debug('Generated mnemonic from PRF output', {
      wordCount: mnemonic.split(' ').length,
      entropyBits: entropy.length * 8,
    });

    return mnemonic;
  } catch (error) {
    logger.error('Failed to convert PRF output to mnemonic', {
      error: error instanceof Error ? error.message : String(error),
      prfLength: prfOutput?.length,
    });
    throw new Error('Failed to derive mnemonic from PRF output');
  }
}

/**
 * Validate a mnemonic derived from PRF output
 *
 * Validates that the mnemonic:
 * 1. Is a valid BIP39 mnemonic (checksum passes)
 * 2. Has exactly 12 words (standard for 128-bit entropy)
 *
 * @param mnemonic - BIP39 mnemonic phrase to validate
 * @returns true if valid 12-word BIP39 mnemonic
 */
export function validatePrfMnemonic(mnemonic: string): boolean {
  try {
    if (!mnemonic || typeof mnemonic !== 'string') {
      return false;
    }

    const trimmed = mnemonic.trim();
    if (!trimmed) {
      return false;
    }

    // Check word count (should be 12 for 128-bit entropy)
    const words = trimmed.split(/\s+/);
    if (words.length !== 12) {
      logger.debug('Invalid mnemonic word count', {
        expected: 12,
        actual: words.length,
      });
      return false;
    }

    // Validate BIP39 checksum
    const isValid = bip39.validateMnemonic(trimmed);

    if (!isValid) {
      logger.debug('BIP39 mnemonic validation failed (checksum)');
    }

    return isValid;
  } catch (error) {
    logger.debug('Mnemonic validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Convert PRF output to 24-word mnemonic (256-bit entropy)
 *
 * Uses the full 32 bytes of PRF output for maximum entropy,
 * producing a 24-word BIP39 mnemonic.
 *
 * @param prfOutput - 32-byte Uint8Array from WebAuthn PRF extension
 * @returns 24-word BIP39 mnemonic phrase
 * @throws Error if PRF output is not exactly 32 bytes
 */
export function prfOutputTo24WordMnemonic(prfOutput: Uint8Array): string {
  try {
    // Validate PRF output length
    if (prfOutput.length !== 32) {
      throw new Error(`PRF output must be exactly 32 bytes, got ${prfOutput.length}`);
    }

    // Use full 32 bytes (256 bits) for 24-word mnemonic
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(prfOutput));

    logger.debug('Generated 24-word mnemonic from PRF output', {
      wordCount: 24,
      entropyBits: 256,
    });

    return mnemonic;
  } catch (error) {
    logger.error('Failed to convert PRF output to 24-word mnemonic', {
      error: error instanceof Error ? error.message : String(error),
      prfLength: prfOutput?.length,
    });
    throw new Error('Failed to derive 24-word mnemonic from PRF output');
  }
}

/**
 * Get entropy from a PRF-derived mnemonic
 *
 * Converts a mnemonic back to its original entropy bytes.
 * Useful for testing or when you need the raw entropy.
 *
 * @param mnemonic - BIP39 mnemonic phrase
 * @returns Uint8Array containing the entropy
 * @throws Error if mnemonic is invalid
 */
export function mnemonicToEntropy(mnemonic: string): Uint8Array {
  try {
    if (!validatePrfMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const entropyHex = bip39.mnemonicToEntropy(mnemonic);
    return Uint8Array.from(Buffer.from(entropyHex, 'hex'));
  } catch (error) {
    logger.error('Failed to convert mnemonic to entropy', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to derive entropy from mnemonic');
  }
}
