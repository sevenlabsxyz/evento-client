/**
 * Tests for passkey-service.ts
 *
 * Tests WebAuthn passkey creation and PRF evaluation.
 * Uses mocked navigator.credentials for WebAuthn operations.
 */

// Mock webauthn-capabilities before importing the service
jest.mock('@/lib/utils/webauthn-capabilities', () => ({
  checkPRFSupport: jest.fn(),
}));

const mockCheckPRFSupport = require('@/lib/utils/webauthn-capabilities').checkPRFSupport;

// Create mock functions
const mockIsUserVerifyingPlatformAuthenticatorAvailable = jest.fn().mockResolvedValue(true);
const mockCredentialsCreate = jest.fn();
const mockCredentialsGet = jest.fn();

// Set up global mocks before importing the service
// Note: jsdom already has window, so we just set the property
(global as any).window.PublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: mockIsUserVerifyingPlatformAuthenticatorAvailable,
} as any;

// Mock crypto.randomUUID for UUID generation
let uuidCounter = 0;
(global as any).crypto.randomUUID = () => {
  uuidCounter++;
  return `00000000-0000-4000-8000-${uuidCounter.toString().padStart(12, '0')}`;
};

Object.defineProperty(global.navigator, 'credentials', {
  value: {
    create: mockCredentialsCreate,
    get: mockCredentialsGet,
  },
  writable: true,
  configurable: true,
});

// Now import the service
import {
  authenticateAndDeriveMnemonic,
  authenticateWithPRF,
  checkPasskeyAvailable,
  checkPasskeyPRFSupport,
  createPasskey,
  generatePRFSalt,
  getPasskeyErrorMessage,
  isPasskeyError,
  PasskeyError,
} from '@/lib/services/passkey-service';

// Helper to create mock PublicKeyCredential
function createMockCredential(options: {
  id?: string;
  rawId?: Uint8Array;
  prfEnabled?: boolean;
  prfOutput?: Uint8Array;
  userHandle?: Uint8Array | null;
}): PublicKeyCredential {
  const rawId = options.rawId || new Uint8Array(32).fill(1);
  const prfOutput = options.prfOutput || new Uint8Array(32).fill(42);

  return {
    id: options.id || 'test-credential-id',
    rawId: rawId.buffer,
    response: {
      attestationObject: new Uint8Array(64).buffer,
      clientDataJSON: new Uint8Array(32).buffer,
      userHandle: options.userHandle !== undefined ? options.userHandle : new Uint8Array(16).buffer,
    } as AuthenticatorAttestationResponse & AuthenticatorAssertionResponse,
    type: 'public-key',
    getClientExtensionResults: () => ({
      prf: {
        enabled: options.prfEnabled ?? true,
        results: {
          first: prfOutput.buffer,
        },
      },
    }),
    authenticatorAttachment: 'platform',
  } as unknown as PublicKeyCredential;
}

describe('passkey-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock PRF support check
    mockCheckPRFSupport.mockResolvedValue({
      supported: true,
      details: {
        webauthnAvailable: true,
        publicKeyCredentialSupported: true,
        prfExtensionSupported: true,
        browser: { name: 'chrome', version: 130, fullVersion: '130.0', isMobile: false, os: 'macos' },
        platformAuthenticatorAvailable: true,
        userVerificationSupported: true,
        limitations: [],
      },
    });

    // Reset mock implementations
    mockCredentialsCreate.mockReset();
    mockCredentialsGet.mockReset();
    mockIsUserVerifyingPlatformAuthenticatorAvailable.mockReset();
    mockIsUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkPasskeyPRFSupport', () => {
    it('returns PRF support result', async () => {
      const result = await checkPasskeyPRFSupport();
      expect(result.supported).toBe(true);
      expect(mockCheckPRFSupport).toHaveBeenCalled();
    });

    it('returns not supported when PRF check fails', async () => {
      mockCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Browser does not support PRF',
      });

      const result = await checkPasskeyPRFSupport();
      expect(result.supported).toBe(false);
      expect(result.reason).toBe('Browser does not support PRF');
    });
  });

  describe('createPasskey', () => {
    it('creates a passkey with PRF extension', async () => {
      const mockCredential = createMockCredential({ prfEnabled: true });
      mockCredentialsCreate.mockResolvedValue(mockCredential);

      const result = await createPasskey('evento.app');

      expect(result.id).toBe('test-credential-id');
      expect(result.prfEnabled).toBe(true);
      expect(result.prfSalts).toBeDefined();
      expect(result.prfSalts?.first).toBeInstanceOf(Uint8Array);
      expect(mockCredentialsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          publicKey: expect.objectContaining({
            rp: { id: 'evento.app', name: 'Evento' },
            extensions: { prf: expect.any(Object) },
          }),
        })
      );
    });

    it('creates passkey with custom options', async () => {
      const mockCredential = createMockCredential({ prfEnabled: true });
      mockCredentialsCreate.mockResolvedValue(mockCredential);

      const result = await createPasskey('evento.app', {
        userDisplayName: 'Custom User',
        authenticatorType: 'platform',
        requireUserVerification: true,
      });

      expect(result.prfEnabled).toBe(true);
      expect(mockCredentialsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          publicKey: expect.objectContaining({
            user: expect.objectContaining({
              displayName: 'Custom User',
            }),
            authenticatorSelection: expect.objectContaining({
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            }),
          }),
        })
      );
    });

    it('throws PasskeyError when PRF is not supported', async () => {
      mockCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF',
      });

      await expect(createPasskey('evento.app')).rejects.toThrow(PasskeyError);
      await expect(createPasskey('evento.app')).rejects.toMatchObject({
        code: 'prf_not_supported',
      });
    });

    it('throws PasskeyError when user cancels', async () => {
      const cancelError = new Error('User cancelled');
      cancelError.name = 'NotAllowedError';
      mockCredentialsCreate.mockRejectedValue(cancelError);

      await expect(createPasskey('evento.app')).rejects.toThrow(PasskeyError);
      await expect(createPasskey('evento.app')).rejects.toMatchObject({
        code: 'cancelled',
      });
    });

    it('throws PasskeyError when not supported', async () => {
      const notSupportedError = new Error('Not supported');
      notSupportedError.name = 'NotSupportedError';
      mockCredentialsCreate.mockRejectedValue(notSupportedError);

      await expect(createPasskey('evento.app')).rejects.toThrow(PasskeyError);
      await expect(createPasskey('evento.app')).rejects.toMatchObject({
        code: 'not_supported',
      });
    });

    it('throws PasskeyError when credential already exists', async () => {
      const invalidStateError = new Error('Credential exists');
      invalidStateError.name = 'InvalidStateError';
      mockCredentialsCreate.mockRejectedValue(invalidStateError);

      await expect(createPasskey('evento.app')).rejects.toThrow(PasskeyError);
      await expect(createPasskey('evento.app')).rejects.toMatchObject({
        code: 'failed',
      });
    });

    it('throws PasskeyError when no credential returned', async () => {
      mockCredentialsCreate.mockResolvedValue(null);

      await expect(createPasskey('evento.app')).rejects.toThrow(PasskeyError);
      await expect(createPasskey('evento.app')).rejects.toMatchObject({
        code: 'failed',
        message: 'Passkey creation returned no credential',
      });
    });

    it('handles PRF not enabled in response', async () => {
      const mockCredential = createMockCredential({ prfEnabled: false });
      mockCredentialsCreate.mockResolvedValue(mockCredential);

      const result = await createPasskey('evento.app');

      expect(result.prfEnabled).toBe(false);
      expect(result.prfSalts).toBeUndefined();
    });
  });

  describe('authenticateWithPRF', () => {
    it('authenticates and evaluates PRF', async () => {
      const prfOutput = new Uint8Array(32).fill(123);
      const mockCredential = createMockCredential({ prfEnabled: true, prfOutput });
      mockCredentialsGet.mockResolvedValue(mockCredential);

      const result = await authenticateWithPRF('evento.app', 'test-salt');

      expect(result.prfOutput).toEqual(prfOutput);
      expect(result.credentialId).toBe('test-credential-id');
      expect(mockCredentialsGet).toHaveBeenCalledWith(
        expect.objectContaining({
          publicKey: expect.objectContaining({
            rpId: 'evento.app',
            extensions: { prf: expect.any(Object) },
          }),
        })
      );
    });

    it('authenticates with Uint8Array salt', async () => {
      const salt = new Uint8Array(32).fill(99);
      const prfOutput = new Uint8Array(32).fill(123);
      const mockCredential = createMockCredential({ prfEnabled: true, prfOutput });
      mockCredentialsGet.mockResolvedValue(mockCredential);

      const result = await authenticateWithPRF('evento.app', salt);

      expect(result.prfOutput).toEqual(prfOutput);
    });

    it('pads short salts to 32 bytes', async () => {
      const shortSalt = new Uint8Array(16).fill(1);
      const prfOutput = new Uint8Array(32).fill(123);
      const mockCredential = createMockCredential({ prfEnabled: true, prfOutput });
      mockCredentialsGet.mockResolvedValue(mockCredential);

      await authenticateWithPRF('evento.app', shortSalt);

      const call = mockCredentialsGet.mock.calls[0][0];
      const evalSalt = call.publicKey.extensions.prf.eval.first;
      expect(evalSalt).toHaveLength(32);
    });

    it('authenticates with specific credential ID', async () => {
      const prfOutput = new Uint8Array(32).fill(123);
      const mockCredential = createMockCredential({ prfEnabled: true, prfOutput });
      mockCredentialsGet.mockResolvedValue(mockCredential);

      await authenticateWithPRF('evento.app', 'test-salt', {
        credentialId: 'specific-credential-id',
      });

      const call = mockCredentialsGet.mock.calls[0][0];
      expect(call.publicKey.allowCredentials).toBeDefined();
      expect(call.publicKey.allowCredentials[0].type).toBe('public-key');
    });

    it('throws PasskeyError when PRF not supported', async () => {
      mockCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Browser does not support PRF',
      });

      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toThrow(PasskeyError);
      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toMatchObject({
        code: 'prf_not_supported',
      });
    });

    it('throws PasskeyError when user cancels', async () => {
      const cancelError = new Error('User cancelled');
      cancelError.name = 'NotAllowedError';
      mockCredentialsGet.mockRejectedValue(cancelError);

      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toThrow(PasskeyError);
      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toMatchObject({
        code: 'cancelled',
      });
    });

    it('throws PasskeyError when no credentials found', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.name = 'NotFoundError';
      mockCredentialsGet.mockRejectedValue(notFoundError);

      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toThrow(PasskeyError);
      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toMatchObject({
        code: 'no_credentials_found',
      });
    });

    it('throws PasskeyError when PRF evaluation fails', async () => {
      const mockCredential = {
        id: 'test-credential-id',
        rawId: new Uint8Array(32).fill(1).buffer,
        response: {},
        type: 'public-key',
        getClientExtensionResults: () => ({
          prf: {
            enabled: true,
            results: {},
          },
        }),
      } as unknown as PublicKeyCredential;
      mockCredentialsGet.mockResolvedValue(mockCredential);

      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toThrow(PasskeyError);
      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toMatchObject({
        code: 'prf_evaluation_failed',
      });
    });

    it('throws PasskeyError when no credential returned', async () => {
      mockCredentialsGet.mockResolvedValue(null);

      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toThrow(PasskeyError);
      await expect(authenticateWithPRF('evento.app', 'salt')).rejects.toMatchObject({
        code: 'no_credentials_found',
      });
    });
  });

  describe('authenticateAndDeriveMnemonic', () => {
    it('authenticates and derives mnemonic from PRF output', async () => {
      const prfOutput = new Uint8Array(32).fill(0);
      const mockCredential = createMockCredential({ prfEnabled: true, prfOutput });
      mockCredentialsGet.mockResolvedValue(mockCredential);

      const result = await authenticateAndDeriveMnemonic('evento.app', 'test-salt');

      expect(result.mnemonic).toBeDefined();
      expect(result.mnemonic.split(' ')).toHaveLength(12);
      expect(result.credentialId).toBe('test-credential-id');
    });
  });

  describe('checkPasskeyAvailable', () => {
    it('returns available when PRF supported and platform authenticator exists', async () => {
      const result = await checkPasskeyAvailable();

      expect(result.available).toBe(true);
      expect(result.prfSupported).toBe(true);
    });

    it('returns not available when PRF not supported', async () => {
      mockCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Browser does not support PRF',
      });

      const result = await checkPasskeyAvailable();

      expect(result.available).toBe(false);
      expect(result.prfSupported).toBe(false);
      expect(result.reason).toBe('Browser does not support PRF');
    });

    it('handles platform authenticator check failure', async () => {
      mockIsUserVerifyingPlatformAuthenticatorAvailable.mockRejectedValue(new Error('Check failed'));

      const result = await checkPasskeyAvailable();

      expect(result.prfSupported).toBe(true);
      expect(result.reason).toBe('Could not check platform authenticator availability');
    });
  });

  describe('generatePRFSalt', () => {
    it('generates a UUID v4 string', () => {
      const salt = generatePRFSalt();

      expect(typeof salt).toBe('string');
      expect(salt).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique salts', () => {
      const salts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        salts.add(generatePRFSalt());
      }
      expect(salts.size).toBe(100);
    });
  });

  describe('PasskeyError', () => {
    it('creates error with code and message', () => {
      const error = new PasskeyError('Test error', 'failed');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('failed');
      expect(error.name).toBe('PasskeyError');
    });

    it('creates error with cause', () => {
      const cause = new Error('Original error');
      const error = new PasskeyError('Test error', 'cancelled', cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('isPasskeyError', () => {
    it('returns true for PasskeyError', () => {
      const error = new PasskeyError('Test', 'failed');
      expect(isPasskeyError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = new Error('Test');
      expect(isPasskeyError(error)).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(isPasskeyError('string')).toBe(false);
      expect(isPasskeyError(null)).toBe(false);
      expect(isPasskeyError(undefined)).toBe(false);
    });
  });

  describe('getPasskeyErrorMessage', () => {
    it('returns user-friendly message for not_supported', () => {
      const error = new PasskeyError('Test', 'not_supported');
      expect(getPasskeyErrorMessage(error)).toBe('Passkeys are not supported on this device or browser.');
    });

    it('returns user-friendly message for cancelled', () => {
      const error = new PasskeyError('Test', 'cancelled');
      expect(getPasskeyErrorMessage(error)).toBe('The passkey operation was cancelled.');
    });

    it('returns user-friendly message for prf_not_supported', () => {
      const error = new PasskeyError('Test', 'prf_not_supported');
      expect(getPasskeyErrorMessage(error)).toBe(
        'Your browser does not support the PRF extension required for passkey-based wallet recovery.'
      );
    });

    it('returns user-friendly message for prf_evaluation_failed', () => {
      const error = new PasskeyError('Test', 'prf_evaluation_failed');
      expect(getPasskeyErrorMessage(error)).toBe('Failed to derive wallet key from passkey. Please try again.');
    });

    it('returns user-friendly message for no_credentials_found', () => {
      const error = new PasskeyError('Test', 'no_credentials_found');
      expect(getPasskeyErrorMessage(error)).toBe('No passkey found. Please create a passkey first.');
    });

    it('returns user-friendly message for invalid_credential', () => {
      const error = new PasskeyError('Test', 'invalid_credential');
      expect(getPasskeyErrorMessage(error)).toBe('The passkey is invalid or has been revoked.');
    });

    it('returns original message for failed code', () => {
      const error = new PasskeyError('Custom failure message', 'failed');
      expect(getPasskeyErrorMessage(error)).toBe('Custom failure message');
    });

    it('returns fallback message for unknown code', () => {
      const error = new PasskeyError('', 'unknown' as any);
      expect(getPasskeyErrorMessage(error)).toBe('An unexpected error occurred with the passkey operation.');
    });
  });
});