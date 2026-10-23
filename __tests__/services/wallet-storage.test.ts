/**
 * WalletStorageService envelope tests (AuditWallet F1).
 *
 * v1 (legacy):  bare base64(salt(16) + iv(12) + AES-GCM-256 ct + 16-byte tag),
 *               200,000 PBKDF2-SHA256 iterations.
 * v2 (current): `v2|<iterations>|<base64 payload>`, 1,000,000 iterations.
 *
 * jsdom provides `crypto.getRandomValues` but not `crypto.subtle`, so Node's
 * webcrypto is installed locally for this suite (Node's implementation
 * accepts cross-realm typed arrays, verified against the jsdom vm context).
 */
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { webcrypto } from 'node:crypto';

if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const PIN = '1234';

/**
 * A real v1 blob: 200k PBKDF2-SHA256 + AES-GCM-256 over the mnemonic above
 * with PIN `1234`, generated with the pre-v2 encryption code path
 * (salt(16)+iv(12)+ct+tag, base64). Proves legacy wallets still decrypt.
 */
const LEGACY_V1_BLOB =
  '+owPy4r/fsQu8n9E0m0h9kLrViMjNRH6LvWxzOdYdclleccgVAmBfIeX9nMfWB/qRk4CPZRi2MgruP6L7Ld58FcfU4NdaF/K0h0Bi1TdTM3unogsJE1qxQDWD6dLYuHAXxL4JTFzSYZr5HN/KFafkO/Dijx6VMN6yIDebnz9nJIGwr/9Y7WNN48=';

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('WalletStorageService envelope', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
    localStorage.clear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('still decrypts a legacy v1 blob (200k iterations, no version prefix)', async () => {
    await expect(WalletStorageService.decryptSeed(LEGACY_V1_BLOB, PIN)).resolves.toBe(MNEMONIC);
  });

  it('encrypts to the v2 envelope (1M iterations) and round-trips', async () => {
    const encrypted = await WalletStorageService.encryptSeed(MNEMONIC, PIN);

    // v2|<iterations>|<base64 payload>
    expect(encrypted.startsWith('v2|')).toBe(true);
    const parts = encrypted.split('|');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('v2');
    expect(Number.parseInt(parts[1], 10)).toBe(1000000);

    await expect(WalletStorageService.decryptSeed(encrypted, PIN)).resolves.toBe(MNEMONIC);
    expect(WalletStorageService.needsReencrypt(encrypted)).toBe(false);
  });

  it('fails with the wrong PIN (v1 and v2) without leaking the seed', async () => {
    await expect(WalletStorageService.decryptSeed(LEGACY_V1_BLOB, '0000')).rejects.toThrow(
      'Invalid password or corrupted backup'
    );

    const encrypted = await WalletStorageService.encryptSeed(MNEMONIC, PIN);
    await expect(WalletStorageService.decryptSeed(encrypted, '0000')).rejects.toThrow(
      'Invalid password or corrupted backup'
    );
  });

  it('re-encrypts a v1 blob with the same PIN, upgrading it to v2', async () => {
    expect(WalletStorageService.needsReencrypt(LEGACY_V1_BLOB)).toBe(true);

    const upgraded = await WalletStorageService.reencryptWithSamePin(LEGACY_V1_BLOB, PIN);

    expect(upgraded.startsWith('v2|')).toBe(true);
    expect(Number.parseInt(upgraded.split('|')[1], 10)).toBe(1000000);
    expect(WalletStorageService.needsReencrypt(upgraded)).toBe(false);

    // Same PIN still decrypts the upgraded blob
    await expect(WalletStorageService.decryptSeed(upgraded, PIN)).resolves.toBe(MNEMONIC);

    // The original v1 blob was not modified by the failed/wrong attempts
    await expect(WalletStorageService.reencryptWithSamePin(LEGACY_V1_BLOB, '0000')).rejects.toThrow(
      'Invalid password or corrupted backup'
    );
  });

  it('rejects a v2 envelope with an out-of-range iterations field', async () => {
    const encrypted = await WalletStorageService.encryptSeed(MNEMONIC, PIN);
    const tampered = encrypted.replace('v2|1000000|', 'v2|999999999999|');

    await expect(WalletStorageService.decryptSeed(tampered, PIN)).rejects.toThrow(
      'Invalid password or corrupted backup'
    );
    expect(WalletStorageService.needsReencrypt(tampered)).toBe(false);
  });
});
