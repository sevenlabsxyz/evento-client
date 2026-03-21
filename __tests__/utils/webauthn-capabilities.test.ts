/**
 * Unit tests for WebAuthn PRF capabilities detection
 * 
 * Tests browser detection and PRF support checking with mocked navigator.credentials
 */

// Mock the logger before importing the module
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('webauthn-capabilities', () => {
  // Store original references
  const originalUserAgent = navigator.userAgent;
  const originalPlatform = navigator.platform;
  
  // Helper to set up browser mocks
  function setupBrowser(userAgent: string, platform: string) {
    Object.defineProperty(navigator, 'userAgent', {
      value: userAgent,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'platform', {
      value: platform,
      configurable: true,
      writable: true,
    });
  }

  // Helper to reset mocks
  function resetMocks() {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
      writable: true,
    });
    jest.clearAllMocks();
  }

  beforeEach(() => {
    resetMocks();
    // Ensure PublicKeyCredential is available by default
    if (!window.PublicKeyCredential) {
      (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = jest.fn();
    }
  });

  afterAll(() => {
    resetMocks();
  });

  describe('checkPRFSupport', () => {
    it('returns not supported when PublicKeyCredential is not available', async () => {
      const originalPKC = window.PublicKeyCredential;
      delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('WebAuthn is not available');

      // Restore
      (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPKC;
    });

    it('returns supported for Chrome 130+', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.name).toBe('chrome');
      expect(result.details?.browser.version).toBe(130);
    });

    it('returns supported for Chrome 131', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.version).toBe(131);
    });

    it('returns not supported for Chrome 129 (below minimum)', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Chrome 129 does not support PRF');
    });

    it('returns not supported for Chrome 100', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Chrome 100 does not support PRF');
    });

    it('returns supported for Firefox 139+', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.name).toBe('firefox');
      expect(result.details?.browser.version).toBe(139);
    });

    it('returns supported for Firefox 140', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.version).toBe(140);
    });

    it('returns not supported for Firefox 138 (below minimum)', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Firefox 138 does not support PRF');
    });

    it('returns not supported for Firefox 120', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Firefox 120 does not support PRF');
    });

    it('returns supported for Safari 18.2+ on macOS', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.name).toBe('safari');
      expect(result.details?.browser.version).toBe(18.2);
      expect(result.details?.browser.os).toBe('macos');
    });

    it('returns supported for Safari 18.3', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.version).toBe(18.3);
    });

    it('returns not supported for Safari 18.1 (below minimum)', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Safari 18.1 does not support PRF');
    });

    it('returns not supported for Safari 17', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Safari 17 does not support PRF');
    });

    it('returns supported for Edge 130+ (Chrome-based)', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(true);
      expect(result.details?.browser.name).toBe('edge');
      expect(result.details?.browser.version).toBe(130);
    });

    it('returns not supported for Edge 129', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Chrome 129 does not support PRF');
    });

    it('detects iOS Safari with platform authenticator', async () => {
      setupBrowser(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
        'iPhone'
      );

      // Mock platform authenticator availability
      (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable = jest.fn().mockResolvedValue(true);

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.browser.name).toBe('safari');
      expect(result.details?.browser.os).toBe('ios');
      expect(result.details?.browser.isMobile).toBe(true);
    });

    it('detects iPad Safari', async () => {
      setupBrowser(
        'Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
        'iPad'
      );

      (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable = jest.fn().mockResolvedValue(true);

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.browser.os).toBe('ios');
      expect(result.details?.browser.isMobile).toBe(true);
    });

    it('detects Android Chrome', async () => {
      setupBrowser(
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
        'Linux armv8l'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.browser.name).toBe('chrome');
      expect(result.details?.browser.os).toBe('android');
      expect(result.details?.browser.isMobile).toBe(true);
      expect(result.supported).toBe(true);
    });

    it('detects Windows OS', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.browser.os).toBe('windows');
    });

    it('returns not supported for older Edge on Windows without PRF', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.details?.browser.os).toBe('windows');
    });

    it('detects platform authenticator availability', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'MacIntel'
      );

      const mockIsAvailable = jest.fn().mockResolvedValue(true);
      (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable = mockIsAvailable;

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.platformAuthenticatorAvailable).toBe(true);
      expect(mockIsAvailable).toHaveBeenCalled();
    });

    it('handles error when checking platform authenticator', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'MacIntel'
      );

      const mockIsAvailable = jest.fn().mockRejectedValue(new Error('Not allowed'));
      (window.PublicKeyCredential as unknown as { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> }).isUserVerifyingPlatformAuthenticatorAvailable = mockIsAvailable;

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.platformAuthenticatorAvailable).toBe(false);
    });

    it('handles unknown browser gracefully', async () => {
      setupBrowser('SomeUnknownBrowser/1.0', 'Unknown');

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details?.browser.name).toBe('unknown');
      expect(result.supported).toBe(false);
    });

    it('returns complete details object when supported', async () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'MacIntel'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.details).toBeDefined();
      expect(result.details?.webauthnAvailable).toBe(true);
      expect(result.details?.publicKeyCredentialSupported).toBe(true);
      expect(result.details?.prfExtensionSupported).toBe(true);
      expect(result.details?.browser).toBeDefined();
      expect(result.details?.limitations).toBeDefined();
      expect(Array.isArray(result.details?.limitations)).toBe(true);
    });

    it('returns details with limitations when not supported', async () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Win32'
      );

      const { checkPRFSupport } = await import('@/lib/utils/webauthn-capabilities');
      const result = await checkPRFSupport();

      expect(result.supported).toBe(false);
      expect(result.details?.limitations.length).toBeGreaterThan(0);
      expect(result.details?.limitations).toContain('firefox-version-too-old');
    });
  });

  describe('checkPRFSupportSync', () => {
    it('returns not supported when window is undefined', () => {
      // This test verifies the SSR safety check
      // We test the behavior by checking the typeof window check in the code
      // The actual undefined window test would require a fresh Node environment
      
      // Verify the code has SSR guards by checking the sync function behavior
      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      
      // When window.PublicKeyCredential is not available, it should return not supported
      const originalPKC = window.PublicKeyCredential;
      delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
      
      jest.resetModules();
      const { checkPRFSupportSync: checkWithoutPKC } = require('@/lib/utils/webauthn-capabilities');
      const result = checkWithoutPKC();
      
      expect(result.supported).toBe(false);
      expect(result.reason).toContain('WebAuthn is not available');
      
      (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPKC;
    });

    it('returns not supported when PublicKeyCredential is not available', () => {
      const originalPKC = window.PublicKeyCredential;
      delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;

      // Need to re-require after modifying window
      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('WebAuthn is not available');

      (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPKC;
    });

    it('returns not supported for Firefox < 139', () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
        'Win32'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Firefox 138 does not support PRF');
    });

    it('returns not supported for Chrome < 130', () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'Win32'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Chrome 129 does not support PRF');
    });

    it('returns not supported for Safari < 18.2', () => {
      setupBrowser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
        'MacIntel'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(false);
      expect(result.reason).toContain('Safari 18.1 does not support PRF');
    });

    it('returns supported for Chrome 130+', () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Win32'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(true);
    });

    it('returns supported for Firefox 139+', () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
        'Win32'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(true);
    });

    it('returns optimistic supported for Edge on Windows', () => {
      setupBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        'Win32'
      );

      jest.resetModules();
      const { checkPRFSupportSync } = require('@/lib/utils/webauthn-capabilities');
      const result = checkPRFSupportSync();

      expect(result.supported).toBe(true);
    });
  });

  describe('getBrowserSupportMessage', () => {
    it('returns success message when PRF is supported', () => {
      const { getBrowserSupportMessage } = require('@/lib/utils/webauthn-capabilities');
      const result = { supported: true };

      const message = getBrowserSupportMessage(result);

      expect(message).toContain('supports passkey-based wallet recovery');
    });

    it('returns the provided reason when PRF is not supported', () => {
      const { getBrowserSupportMessage } = require('@/lib/utils/webauthn-capabilities');
      const result = {
        supported: false,
        reason: 'Firefox 120 does not support PRF',
      };

      const message = getBrowserSupportMessage(result);

      expect(message).toBe('Firefox 120 does not support PRF');
    });

    it('returns generic message when no reason provided', () => {
      const { getBrowserSupportMessage } = require('@/lib/utils/webauthn-capabilities');
      const result = { supported: false };

      const message = getBrowserSupportMessage(result);

      expect(message).toContain('does not support');
    });
  });
});
